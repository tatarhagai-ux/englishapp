import { afterEach, describe, expect, it, vi } from "vitest";

async function loadEnv(vars: Record<string, string>) {
  vi.resetModules();
  for (const k of ["LLM_PROVIDER", "OPENROUTER_API_KEY", "DEEPSEEK_API_KEY", "LLM_CHAT_MODEL"]) vi.stubEnv(k, "");
  for (const [k, v] of Object.entries(vars)) vi.stubEnv(k, v);
  return import("@/lib/env");
}

afterEach(() => vi.unstubAllEnvs());

describe("llmConfig", () => {
  it("uses OpenRouter with DeepSeek V3.2 when only that key exists", async () => {
    const { llmConfig } = await loadEnv({ OPENROUTER_API_KEY: "sk-or-1234567890" });
    expect(llmConfig()).toMatchObject({ provider: "openrouter", chatModel: "deepseek/deepseek-v3.2" });
  });

  it("uses DeepSeek direct when only its key exists", async () => {
    const { llmConfig } = await loadEnv({ DEEPSEEK_API_KEY: "sk-ds-1234567890" });
    expect(llmConfig()).toMatchObject({ provider: "deepseek", chatModel: "deepseek-chat" });
  });

  it("lets LLM_PROVIDER and LLM_CHAT_MODEL override the defaults", async () => {
    const { llmConfig } = await loadEnv({
      OPENROUTER_API_KEY: "sk-or-1234567890",
      DEEPSEEK_API_KEY: "sk-ds-1234567890",
      LLM_PROVIDER: "deepseek",
      LLM_CHAT_MODEL: "deepseek-reasoner",
    });
    expect(llmConfig()).toMatchObject({ provider: "deepseek", chatModel: "deepseek-reasoner" });
  });

  it("throws a not-configured error when the chosen provider has no key", async () => {
    const { llmConfig, NotConfiguredError } = await loadEnv({ LLM_PROVIDER: "deepseek" });
    expect(() => llmConfig()).toThrow(NotConfiguredError);
  });
});
