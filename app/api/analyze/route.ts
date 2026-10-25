import { NextResponse } from "next/server";
import { z } from "zod";
import { llmConfig } from "@/lib/env";
import { llm, type Usage } from "@/lib/providers/llm";
import { errorResponse } from "@/lib/http/errors";
import { turn } from "@/lib/conversation/types";
import { buildAnalyzerMessages, parseAnalysis } from "@/lib/prompts/analyzer";
import { scenarioById } from "@/content/scenarios";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const body = z.object({
  scenarioId: z.string().min(1).max(80),
  history: z.array(turn).min(1).max(120),
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

/** Post-conversation analysis. One retry with a stricter nudge if the JSON comes back broken. */
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
    const messages = buildAnalyzerMessages(scenario, parsed.data.history);
    let usage: Usage | undefined;
    for (let attempt = 0; attempt < 2; attempt++) {
      const res = await llm().complete({
        model: analyzerModel,
        messages:
          attempt === 0
            ? messages
            : [
                ...messages,
                { role: "user", content: "Your last reply was not valid JSON. Reply with the JSON object only." },
              ],
        temperature: 0.2,
        maxTokens: 1800,
        json: true,
        signal: req.signal,
      });
      usage = addUsage(usage, res.usage);
      const analysis = parseAnalysis(res.text);
      if (analysis) return NextResponse.json({ analysis, model: analyzerModel, usage: usage ?? null });
    }
    return NextResponse.json({ error: "analysis_failed" }, { status: 502 });
  } catch (err) {
    return errorResponse(err);
  }
}
