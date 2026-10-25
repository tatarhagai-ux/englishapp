/**
 * List prices used to estimate spend when a provider doesn't report cost itself.
 * Checked October 2026 (see docs/research). Prices move fast, so these are estimates and
 * the meter prefers provider-reported cost (OpenRouter returns it per request).
 */
export const PRICING = {
  llm: {
    // USD per million tokens. `cachedInput` applies to prompt tokens served from cache.
    "deepseek/deepseek-v3.2": { input: 0.21, cachedInput: 0.21, output: 0.31 },
    "deepseek-chat": { input: 0.28, cachedInput: 0.028, output: 0.42 },
    default: { input: 1.0, cachedInput: 1.0, output: 3.0 },
  } as Record<string, { input: number; cachedInput: number; output: number }>,
  azure: {
    // F0 free tier per month; beyond it, standard pay-as-you-go rates.
    sttFreeSecondsPerMonth: 5 * 60 * 60,
    sttUsdPerHour: 1.0,
    ttsFreeCharsPerMonth: 500_000,
    ttsUsdPerMillionChars: 15,
  },
} as const;

export function llmCostUsd(model: string, promptTokens: number, completionTokens: number, cachedTokens = 0): number {
  const p = PRICING.llm[model] ?? PRICING.llm.default;
  const cached = Math.min(cachedTokens, promptTokens);
  return ((promptTokens - cached) * p.input + cached * p.cachedInput + completionTokens * p.output) / 1_000_000;
}

/** Cost of TTS characters given how many were already used this month (free tier first). */
export function ttsCostUsd(chars: number, usedThisMonth: number): number {
  const free = Math.max(0, PRICING.azure.ttsFreeCharsPerMonth - usedThisMonth);
  const billable = Math.max(0, chars - free);
  return (billable * PRICING.azure.ttsUsdPerMillionChars) / 1_000_000;
}

export function sttCostUsd(seconds: number, usedThisMonth: number): number {
  const free = Math.max(0, PRICING.azure.sttFreeSecondsPerMonth - usedThisMonth);
  const billable = Math.max(0, seconds - free);
  return (billable / 3600) * PRICING.azure.sttUsdPerHour;
}

/** Cost of one LLM call: the provider's own figure when it reports one, else our estimate. */
export function usageCostUsd(
  model: string,
  usage:
    | { promptTokens: number; completionTokens: number; cachedPromptTokens?: number; costUsd?: number }
    | null
    | undefined,
): number {
  if (!usage) return 0;
  if (typeof usage.costUsd === "number") return usage.costUsd;
  return llmCostUsd(model, usage.promptTokens, usage.completionTokens, usage.cachedPromptTokens ?? 0);
}
