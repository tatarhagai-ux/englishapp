import { PLACEMENT, SEED_ERRORS } from "@/content/learner-seed";

/**
 * The learner as the models should picture him. Kept short: every token here is re-sent
 * on every turn (it sits in the cached prefix, so it is cheap, but it still adds latency).
 */
export const LEARNER_PROFILE = `The learner is Hagai, a native Hebrew speaker from Israel in his twenties.
Understanding level: ${PLACEMENT.comprehension}. Speaking level: ${PLACEMENT.production}. He understands well but builds spoken sentences slowly and often translates from Hebrew.
Interests: AI tools and automation, business and self-help books, long-term investing, fitness, the Azure AZ-900 exam he is studying for.
Goals for this year: pass a job interview in English, talk freely and confidently, travel and live abroad.`;

export function describeTargets(keys: string[]): string {
  const known = keys
    .map((k) => SEED_ERRORS.find((e) => e.key === k))
    .filter((e): e is (typeof SEED_ERRORS)[number] => Boolean(e));
  if (known.length === 0) return "";
  return known.map((e) => `- ${e.title}. Wrong: "${e.example}" Right: "${e.better}"`).join("\n");
}
