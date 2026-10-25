import "server-only";
import { requireOpenRouter } from "@/lib/env";
import { createOpenRouter } from "./openrouter";
import type { LlmProvider } from "./types";

let cached: LlmProvider | null = null;

export function llm(): LlmProvider {
  cached ??= createOpenRouter({
    ...requireOpenRouter(),
    appUrl: process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined,
  });
  return cached;
}

export * from "./types";
