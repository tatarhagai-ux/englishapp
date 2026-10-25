import { describe, expect, it } from "vitest";
import { toUsage } from "@/lib/providers/llm/openai-compatible";
import { llmCostUsd } from "@/lib/cost/pricing";

describe("usage parsing", () => {
  it("reads DeepSeek cache hits", () => {
    expect(toUsage({ prompt_tokens: 3000, completion_tokens: 60, prompt_cache_hit_tokens: 2800 })).toEqual({
      promptTokens: 3000,
      completionTokens: 60,
      cachedPromptTokens: 2800,
      costUsd: undefined,
    });
  });

  it("reads OpenRouter cost and cached tokens", () => {
    expect(
      toUsage({
        prompt_tokens: 100,
        completion_tokens: 10,
        cost: 0.0001,
        prompt_tokens_details: { cached_tokens: 50 },
      }),
    ).toMatchObject({ cachedPromptTokens: 50, costUsd: 0.0001 });
  });

  it("prices cached DeepSeek tokens at a tenth", () => {
    const full = llmCostUsd("deepseek-chat", 3000, 60);
    const cached = llmCostUsd("deepseek-chat", 3000, 60, 2800);
    expect(full).toBeCloseTo((3000 * 0.28 + 60 * 0.42) / 1e6, 10);
    expect(cached).toBeCloseTo((200 * 0.28 + 2800 * 0.028 + 60 * 0.42) / 1e6, 10);
    expect(cached).toBeLessThan(full / 3);
  });
});
