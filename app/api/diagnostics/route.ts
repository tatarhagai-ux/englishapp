import { NextResponse } from "next/server";
import { llmConfig } from "@/lib/env";
import { safeEqual } from "@/lib/auth/gate";
import { llm, type Usage } from "@/lib/providers/llm";
import { errorResponse } from "@/lib/http/errors";
import { buildTutorSystemPrompt, toChatMessages } from "@/lib/prompts/tutor";
import { buildAnalyzerMessages, parseAnalysis } from "@/lib/prompts/analyzer";
import { scenarioById } from "@/content/scenarios";
import evalSet from "@/eval/sentences.json";
import { pickItems, type EvalItem as Item } from "@/lib/diagnostics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Model check from inside the deployed app (the only place with the real key):
 * GET /api/diagnostics?token=…&models=a,b&n=8
 * For each model: one tutor turn (time to first words, total) and n labeled sentences
 * through the real analyzer (mistakes caught, needless "fixes"), with the cost OpenRouter
 * reports. Off unless DIAG_TOKEN is set; a run costs a few cents at most.
 */
const MAX_MODELS = 3;
const MAX_SENTENCES = 12;

function addCost(total: number, u?: Usage) {
  return total + (u?.costUsd ?? 0);
}

async function checkModel(model: string, items: Item[]) {
  const scenario = scenarioById("free-your-week")!;
  let cost = 0;
  // 1. A tutor turn, streamed like a real conversation.
  const system = buildTutorSystemPrompt({
    scenario,
    tutorName: "Ava",
    correctionMode: "gentle",
    targetKeys: [],
    wrapUp: false,
  });
  const history = [
    { role: "tutor" as const, text: scenario.opener },
    {
      role: "learner" as const,
      text: "I study for AZ-900 two weeks and it's very interesting for me",
      input: "voice" as const,
    },
  ];
  const started = Date.now();
  let firstMs: number | null = null;
  let reply = "";
  for await (const ev of llm().stream({
    model,
    messages: toChatMessages(system, history),
    temperature: 0.7,
    maxTokens: 120,
  })) {
    if (ev.type === "delta") {
      firstMs ??= Date.now() - started;
      reply += ev.text;
    } else cost = addCost(cost, ev.usage);
  }
  const chat = { firstWordsMs: firstMs, totalMs: Date.now() - started, reply: reply.trim() };

  // 2. Labeled sentences through the real analyzer prompt.
  const outcomes = await Promise.all(
    items.map(async (it) => {
      const res = await llm().complete({
        model,
        messages: buildAnalyzerMessages(scenario, [
          { role: "tutor", text: it.question },
          { role: "learner", text: it.text, input: "voice" },
        ]),
        temperature: 0.2,
        maxTokens: 1500,
        json: true,
      });
      cost = addCost(cost, res.usage);
      const a = parseAnalysis(res.text);
      const reported = a ? [...a.corrections.map((c) => c.error_key), ...a.other_errors.map((o) => o.error_key)] : [];
      return { expected: it.errors, reported, parsed: Boolean(a) };
    }),
  );
  const withErrors = outcomes.filter((o) => o.expected.length > 0);
  const clean = outcomes.filter((o) => o.expected.length === 0);
  const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : null);
  return {
    model,
    chat,
    analyzer: {
      sentences: outcomes.length,
      caughtPct: pct(withErrors.filter((o) => o.reported.length > 0).length, withErrors.length),
      needlessFixPct: pct(clean.filter((o) => o.reported.length > 0).length, clean.length),
      parseFailures: outcomes.filter((o) => !o.parsed).length,
    },
    costUsd: Math.round(cost * 100000) / 100000,
  };
}

export async function GET(req: Request) {
  const expected = process.env.DIAG_TOKEN;
  const url = new URL(req.url);
  const token = url.searchParams.get("token") ?? "";
  if (!expected || !safeEqual(token, expected)) return NextResponse.json({ error: "not_found" }, { status: 404 });

  try {
    const cfg = llmConfig();
    const models = (url.searchParams.get("models") ?? cfg.chatModel)
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean)
      .slice(0, MAX_MODELS);
    const n = Math.min(MAX_SENTENCES, Math.max(3, Number(url.searchParams.get("n") ?? 8) || 8));
    const items = pickItems((evalSet as { items: Item[] }).items, n);
    const results = await Promise.all(
      models.map((m) => checkModel(m, items).catch((err: unknown) => ({ model: m, error: String(err) }))),
    );
    return NextResponse.json({ provider: cfg.provider, results });
  } catch (err) {
    return errorResponse(err);
  }
}
