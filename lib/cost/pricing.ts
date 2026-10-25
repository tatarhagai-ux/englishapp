/**
 * List prices used to estimate spend when a provider doesn't report cost itself.
 * Checked October 2026 (see docs/research). Prices move fast, so these are estimates and
 * the meter prefers provider-reported cost (OpenRouter returns it per request).
 */
export const PRICING = {
  llm: {
    // USD per million tokens.
    "deepseek/deepseek-v3.2": { input: 0.21, output: 0.31 },
    default: { input: 1.0, output: 3.0 },
  } as Record<string, { input: number; output: number }>,
  azure: {
    // F0 free tier per month; beyond it, standard pay-as-you-go rates.
    sttFreeSecondsPerMonth: 5 * 60 * 60,
    sttUsdPerHour: 1.0,
    ttsFreeCharsPerMonth: 500_000,
    ttsUsdPerMillionChars: 15,
  },
} as const;

export function llmCostUsd(model: string, promptTokens: number, completionTokens: number): number {
  const p = PRICING.llm[model] ?? PRICING.llm.default;
  return (promptTokens * p.input + completionTokens * p.output) / 1_000_000;
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
