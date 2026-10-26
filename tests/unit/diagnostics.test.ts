import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ChatRequest as LlmChatRequest } from "@/lib/providers/llm/types";
import { pickItems } from "@/lib/diagnostics";
import evalSet from "@/eval/sentences.json";

const calls: LlmChatRequest[] = [];
vi.mock("@/lib/providers/llm", () => ({
  llm: () => ({
    name: "fake",
    async *stream(req: LlmChatRequest) {
      calls.push(req);
      yield { type: "delta", text: "Oh nice! " };
      yield { type: "delta", text: "What's the hardest part?" };
      yield { type: "done", usage: { promptTokens: 900, completionTokens: 12, costUsd: 0.0003 } };
    },
    async complete(req: LlmChatRequest) {
      calls.push(req);
      // Reports a mistake for every sentence: catches all, but "fixes" the clean ones too.
      return {
        text: JSON.stringify({ corrections: [{ original: "a", better: "b", why_en: "c", error_key: "x" }] }),
        usage: { promptTokens: 2000, completionTokens: 200, costUsd: 0.001 },
      };
    },
  }),
}));

beforeEach(() => {
  vi.resetModules();
  calls.length = 0;
  vi.stubEnv("OPENROUTER_API_KEY", "sk-or-test-1234567890");
});
afterEach(() => vi.unstubAllEnvs());

const get = (q: string) => new Request(`http://local/api/diagnostics?${q}`);

describe("GET /api/diagnostics", () => {
  it("is off without DIAG_TOKEN and rejects a wrong token", async () => {
    const { GET } = await import("@/app/api/diagnostics/route");
    expect((await GET(get("token=x"))).status).toBe(404);
    vi.stubEnv("DIAG_TOKEN", "secret-token-123");
    expect((await GET(get("token=wrong"))).status).toBe(404);
  });

  it("reports speed, accuracy and cost per model, capped in size", async () => {
    vi.stubEnv("DIAG_TOKEN", "secret-token-123");
    const { GET } = await import("@/app/api/diagnostics/route");
    const res = await GET(get("token=secret-token-123&models=a/one,b/two,c/three,d/four&n=6"));
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      results: { model: string; analyzer: Record<string, number>; costUsd: number }[];
    };
    expect(body.results.map((r) => r.model)).toEqual(["a/one", "b/two", "c/three"]);
    const r = body.results[0];
    expect(r.analyzer).toMatchObject({ sentences: 6, caughtPct: 100, needlessFixPct: 100, parseFailures: 0 });
    expect(r.costUsd).toBeCloseTo(0.0003 + 6 * 0.001, 6);
    expect(calls.length).toBe(3 * 7);
  });

  it("picks a mix of sentences with and without mistakes", () => {
    const items = pickItems(
      (evalSet as { items: { id: string; question: string; text: string; errors: string[] }[] }).items,
      9,
    );
    expect(items).toHaveLength(9);
    expect(items.filter((i) => i.errors.length === 0)).toHaveLength(3);
  });
});
