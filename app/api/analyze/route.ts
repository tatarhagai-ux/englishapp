import { NextResponse } from "next/server";
import { z } from "zod";
import { llmConfig } from "@/lib/env";
import { llm, type Usage } from "@/lib/providers/llm";
import type { ChatMessage } from "@/lib/providers/llm/types";
import { errorResponse } from "@/lib/http/errors";
import { turn } from "@/lib/conversation/types";
import { buildAnalyzerMessages, buildCoachMessages, parseAnalysis, parseCoach } from "@/lib/prompts/analyzer";
import { scenarioById } from "@/content/scenarios";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Don't start a retry this late: it would run into the function's time limit. */
const RETRY_BEFORE_MS = 25_000;

const body = z.object({
  scenarioId: z.string().min(1).max(80),
  history: z.array(turn).min(1).max(120),
  /** Facts already remembered, so the report can retire the ones that are out of date. */
  memory: z.array(z.string().max(160)).max(40).default([]),
});

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

/** One JSON call with a single retry if the reply doesn't parse and there is still time. */
async function jsonCall<T>(
  model: string,
  messages: ChatMessage[],
  maxTokens: number,
  parse: (text: string) => T | null,
  started: number,
  signal: AbortSignal,
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
    const { analyzerModel } = llmConfig();
    const started = Date.now();
    const { history, memory } = parsed.data;
    const [core, coach] = await Promise.all([
      jsonCall(
        analyzerModel,
        buildAnalyzerMessages(scenario, history, memory),
        1800,
        parseAnalysis,
        started,
        req.signal,
      ),
      jsonCall(analyzerModel, buildCoachMessages(scenario, history), 1200, parseCoach, started, req.signal).catch(
        (err: unknown) => {
          console.error("coach summary failed", err);
          return { value: null, usage: undefined };
        },
      ),
    ]);
    const usage = addUsage(core.usage, coach.usage);
    if (!core.value) return NextResponse.json({ error: "analysis_failed" }, { status: 502 });
    if (!coach.value) console.error("coach summary missing");
    const analysis = { ...core.value, ...(coach.value ?? {}) };
    return NextResponse.json({ analysis, model: analyzerModel, usage: usage ?? null });
  } catch (err) {
    return errorResponse(err);
  }
}
