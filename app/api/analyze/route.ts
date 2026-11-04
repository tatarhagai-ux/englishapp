import { NextResponse } from "next/server";
import { z } from "zod";
import { llmConfig } from "@/lib/env";
import { llm, type Usage } from "@/lib/providers/llm";
import type { ChatMessage } from "@/lib/providers/llm/types";
import { errorResponse } from "@/lib/http/errors";
import { ProviderError } from "@/lib/providers/errors";
import { CHAT_LIMITS, turn } from "@/lib/conversation/types";
import {
  analysisSchema,
  buildAnalyzerMessages,
  buildCoachMessages,
  coachSchema,
  parseAnalysis,
  parseCoach,
  whyUnusable,
} from "@/lib/prompts/analyzer";
import { scenarioById } from "@/content/scenarios";
import { challengeById } from "@/content/challenges";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Don't start a retry this late: it would run into the function's time limit. */
const RETRY_BEFORE_MS = 25_000;

const body = z.object({
  scenarioId: z.string().min(1).max(80),
  history: z.array(turn).min(1).max(120),
  /** Facts already remembered, so the report can retire the ones that are out of date. */
  memory: z.array(z.string().max(CHAT_LIMITS.fact)).max(40).default([]),
  /** Today's challenge id, so the wrap-up can say whether he met it. */
  challenge: z.string().max(40).optional(),
  /**
   * The app asks for the fixes ("core") and the teacher's wrap-up ("coach") as two separate
   * requests at the same time, so each has its own time limit and neither can break the
   * other. Without it, both are made in this one request (older clients, diagnostics).
   */
  only: z.enum(["core", "coach"]).optional(),
});

/** Token room per reply. Hebrew lines cost several times more tokens than English ones. */
const CORE_MAX_TOKENS = 2400;
const COACH_MAX_TOKENS = 2400;

function addUsage(a: Usage | undefined, b: Usage | undefined): Usage | undefined {
  if (!a) return b;
  if (!b) return a;
  return {
    promptTokens: a.promptTokens + b.promptTokens,
    completionTokens: a.completionTokens + b.completionTokens,
    cachedPromptTokens: (a.cachedPromptTokens ?? 0) + (b.cachedPromptTokens ?? 0),
    costUsd: a.costUsd !== undefined && b.costUsd !== undefined ? a.costUsd + b.costUsd : undefined,
  };
}

/**
 * Run with the report model, falling back to the chat model when the report model is
 * refused (renamed, retired, or not open to this account). Busy or slow providers are not
 * retried with another model: the request has its own time limit.
 */
async function withFallback<T>(models: string[], run: (model: string) => Promise<T>): Promise<T & { model: string }> {
  let lastError: unknown;
  for (const model of [...new Set(models)]) {
    try {
      return { ...(await run(model)), model };
    } catch (err) {
      lastError = err;
      const refused = err instanceof ProviderError && [400, 403, 404].includes(err.status);
      if (!refused) throw err;
      console.error(`analyzer model ${model} refused, trying the next one`, err.message);
    }
  }
  throw lastError;
}

/** One JSON call with a single retry if the reply doesn't parse and there is still time. */
async function jsonCall<T>(
  model: string,
  messages: ChatMessage[],
  maxTokens: number,
  parse: (text: string) => T | null,
  started: number,
  signal: AbortSignal,
  label = "analysis",
): Promise<{ value: T | null; usage?: Usage }> {
  let usage: Usage | undefined;
  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt > 0 && Date.now() - started > RETRY_BEFORE_MS) break;
    const res = await llm().complete({
      model,
      messages:
        attempt === 0
          ? messages
          : [
              ...messages,
              { role: "user", content: "Your last reply was not valid JSON. Reply with a shorter JSON object only." },
            ],
      temperature: 0.2,
      maxTokens,
      json: true,
      signal,
    });
    usage = addUsage(usage, res.usage);
    const value = parse(res.text);
    if (value) return { value, usage };
    // Why it failed, without the content: cut off by the token limit, or not JSON at all.
    console.error(
      `${label} reply unusable (model=${model}, attempt=${attempt + 1}, finish=${res.finishReason ?? "?"}, chars=${res.text.length}, why=${whyUnusable(res.text, label === "analysis" ? analysisSchema : coachSchema)})`,
    );
  }
  return { value: null, usage };
}

/**
 * Post-conversation analysis, in two calls at once: the fixes (what the app tracks) and the
 * teacher's wrap-up (score, feedback, next steps, homework). Splitting keeps each reply
 * short enough for a fast model; the wrap-up is a bonus, so if it fails the fixes still return.
 */
export async function POST(req: Request) {
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request", issues: parsed.error.issues }, { status: 400 });
  }
  const scenario = scenarioById(parsed.data.scenarioId);
  if (!scenario) return NextResponse.json({ error: "unknown_scenario" }, { status: 400 });
  if (!parsed.data.history.some((t) => t.role === "learner")) {
    return NextResponse.json({ error: "nothing_to_analyze" }, { status: 400 });
  }

  try {
    const { analyzerModel, chatModel } = llmConfig();
    const models = [analyzerModel, chatModel];
    const started = Date.now();
    const { history, memory } = parsed.data;
    const coachCall = () =>
      withFallback(models, (m) =>
        jsonCall(
          m,
          buildCoachMessages(scenario, history, challengeById(parsed.data.challenge)),
          COACH_MAX_TOKENS,
          parseCoach,
          started,
          req.signal,
          "coach summary",
        ),
      );
    if (parsed.data.only === "coach") {
      const coach = await coachCall();
      console.log(`analyze coach done (model=${coach.model}, ok=${!!coach.value}, ms=${Date.now() - started})`);
      if (!coach.value) return NextResponse.json({ error: "analysis_failed" }, { status: 502 });
      return NextResponse.json({ coach: coach.value, model: coach.model, usage: coach.usage ?? null });
    }
    const coreCall = () =>
      withFallback(models, (m) =>
        jsonCall(
          m,
          buildAnalyzerMessages(scenario, history, memory),
          CORE_MAX_TOKENS,
          parseAnalysis,
          started,
          req.signal,
        ),
      );
    if (parsed.data.only === "core") {
      const core = await coreCall();
      console.log(`analyze core done (model=${core.model}, ok=${!!core.value}, ms=${Date.now() - started})`);
      if (!core.value) return NextResponse.json({ error: "analysis_failed" }, { status: 502 });
      return NextResponse.json({ analysis: core.value, model: core.model, usage: core.usage ?? null });
    }
    const [core, coach] = await Promise.all([
      coreCall(),
      coachCall().catch((err: unknown) => {
        console.error("coach summary failed", err);
        return { value: null, usage: undefined, model: analyzerModel };
      }),
    ]);
    const usage = addUsage(core.usage, coach.usage);
    if (!core.value) return NextResponse.json({ error: "analysis_failed" }, { status: 502 });
    if (!coach.value) console.error("coach summary missing");
    const analysis = { ...core.value, ...(coach.value ?? {}) };
    // Cost is reported by OpenRouter per call; the model named here is the one that wrote the fixes.
    return NextResponse.json({ analysis, model: core.model, usage: usage ?? null });
  } catch (err) {
    return errorResponse(err);
  }
}
