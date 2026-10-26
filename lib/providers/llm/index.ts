import "server-only";
import { llmConfig } from "@/lib/env";
import { createOpenAICompatible } from "./openai-compatible";
import type { LlmProvider } from "./types";

let cached: LlmProvider | null = null;

/**
 * The configured chat provider. DeepSeek direct is the cheapest for DeepSeek models (its
 * context cache bills repeated prompt prefixes at a tenth); OpenRouter trades a little
 * cost for one key across many models and automatic fallback between hosts.
 */
export function llm(): LlmProvider {
  if (cached) return cached;
  const cfg = llmConfig();
  if (cfg.provider === "deepseek") {
    cached = createOpenAICompatible({
      name: "deepseek",
      endpoint: "https://api.deepseek.com/chat/completions",
      apiKey: cfg.apiKey,
      streamBody: { stream_options: { include_usage: true } },
    });
  } else {
    const appUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
    cached = createOpenAICompatible({
      name: "openrouter",
      endpoint: "https://openrouter.ai/api/v1/chat/completions",
      apiKey: cfg.apiKey,
      headers: { "X-Title": "Speakwise", ...(appUrl ? { "HTTP-Referer": `https://${appUrl}` } : {}) },
      // Hybrid models (DeepSeek V4, Qwen3, Gemini Flash) can think before answering; a spoken
      // tutor needs words fast, and thinking can eat the whole token budget, leaving no reply.
      extraBody: { usage: { include: true }, reasoning: { enabled: false } },
    });
  }
  return cached;
}

export * from "./types";
