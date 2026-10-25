/**
 * Correction-quality eval: runs the real analyzer prompt over labeled sentences and
 * reports, per model, how many mistakes were caught and how many correct sentences got
 * "fixed" anyway. Use it before switching models or editing the analyzer prompt.
 *
 *   OPENROUTER_API_KEY=... npm run eval
 *   OPENROUTER_API_KEY=... EVAL_MODELS="deepseek/deepseek-v3.2,moonshotai/kimi-k2" npm run eval
 *   DEEPSEEK_API_KEY=... EVAL_PROVIDER=deepseek EVAL_MODELS=deepseek-chat npm run eval
 *
 * Each run costs a few cents. Results are also written to eval/results/<timestamp>.json.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildAnalyzerMessages, parseAnalysis } from "../lib/prompts/analyzer";
import { scenarioById } from "../content/scenarios";

interface Item {
  id: string;
  question: string;
  text: string;
  errors: string[];
}

interface Outcome {
  id: string;
  expected: string[];
  reported: string[];
  parsed: boolean;
  ms: number;
}

const provider = process.env.EVAL_PROVIDER === "deepseek" ? "deepseek" : "openrouter";
const apiKey = provider === "deepseek" ? process.env.DEEPSEEK_API_KEY : process.env.OPENROUTER_API_KEY;
const endpoint =
  process.env.EVAL_ENDPOINT ??
  (provider === "deepseek"
    ? "https://api.deepseek.com/chat/completions"
    : "https://openrouter.ai/api/v1/chat/completions");
const models = (process.env.EVAL_MODELS ?? (provider === "deepseek" ? "deepseek-chat" : "deepseek/deepseek-v3.2"))
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);
const limit = Number(process.env.EVAL_LIMIT ?? 0) || undefined;
const CONCURRENCY = 4;

if (!apiKey) {
  console.error(`Set ${provider === "deepseek" ? "DEEPSEEK_API_KEY" : "OPENROUTER_API_KEY"} to run the eval.`);
  process.exit(1);
}

const dir = join(process.cwd(), "eval");
const items = (JSON.parse(readFileSync(join(dir, "sentences.json"), "utf8")) as { items: Item[] }).items.slice(
  0,
  limit,
);
const scenario = scenarioById("free-your-week")!;

async function analyze(model: string, item: Item): Promise<Outcome> {
  const messages = buildAnalyzerMessages(scenario, [
    { role: "tutor", text: item.question },
    { role: "learner", text: item.text, input: "voice" },
  ]);
  const started = Date.now();
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "X-Title": "Speakwise eval" },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.2,
      max_tokens: 1500,
      response_format: { type: "json_object" },
    }),
  });
  const ms = Date.now() - started;
  if (!res.ok) throw new Error(`${model}: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const analysis = parseAnalysis(json.choices?.[0]?.message?.content ?? "");
  const reported = analysis
    ? [...new Set([...analysis.corrections.map((c) => c.error_key), ...analysis.other_errors.map((o) => o.error_key)])]
    : [];
  return { id: item.id, expected: item.errors, reported, parsed: Boolean(analysis), ms };
}

async function pool<T, R>(list: T[], fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(list.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (next < list.length) {
        const i = next++;
        out[i] = await fn(list[i]);
      }
    }),
  );
  return out;
}

function score(outcomes: Outcome[]) {
  const withErrors = outcomes.filter((o) => o.expected.length > 0);
  const clean = outcomes.filter((o) => o.expected.length === 0);
  const detected = withErrors.filter((o) => o.reported.length > 0).length;
  const keyHits = withErrors.filter((o) => o.expected.some((k) => o.reported.includes(k))).length;
  const falseFixes = clean.filter((o) => o.reported.length > 0).length;
  const pct = (n: number, d: number) => (d ? `${Math.round((n / d) * 100)}%` : "n/a");
  return {
    detected: pct(detected, withErrors.length),
    rightCategory: pct(keyHits, withErrors.length),
    falseCorrections: pct(falseFixes, clean.length),
    parseFailures: outcomes.filter((o) => !o.parsed).length,
    medianMs: [...outcomes.map((o) => o.ms)].sort((a, b) => a - b)[Math.floor(outcomes.length / 2)],
  };
}

async function main() {
  console.log(`Eval: ${items.length} sentences × ${models.length} model(s) via ${provider}\n`);
  const results: Record<string, { summary: ReturnType<typeof score>; outcomes: Outcome[] }> = {};
  for (const model of models) {
    process.stdout.write(`${model} … `);
    const outcomes = await pool(items, (it) => analyze(model, it));
    results[model] = { summary: score(outcomes), outcomes };
    console.log("done");
  }
  console.log("");
  console.table(Object.fromEntries(Object.entries(results).map(([m, r]) => [m, r.summary])));
  console.log(
    "\ndetected = sentences with a mistake where any mistake was reported" +
      "\nrightCategory = the expected mistake type was among those reported" +
      "\nfalseCorrections = already-natural sentences that got 'fixed' (lower is better)",
  );
  for (const [model, r] of Object.entries(results)) {
    const misses = r.outcomes.filter((o) => o.expected.length && !o.expected.some((k) => o.reported.includes(k)));
    const falses = r.outcomes.filter((o) => !o.expected.length && o.reported.length);
    if (misses.length || falses.length) {
      console.log(`\n${model}`);
      for (const o of misses)
        console.log(`  missed ${o.id}: expected ${o.expected.join(", ")}, got ${o.reported.join(", ") || "nothing"}`);
      for (const o of falses) console.log(`  false fix ${o.id}: ${o.reported.join(", ")}`);
    }
  }
  mkdirSync(join(dir, "results"), { recursive: true });
  const file = join(dir, "results", `${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  writeFileSync(file, JSON.stringify(results, null, 2));
  console.log(`\nSaved ${file}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
