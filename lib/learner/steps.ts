import { saySetById } from "@/content/say";
import type { Analysis } from "@/lib/prompts/analyzer";
import type { LearnerState } from "./model";

export interface StepLink {
  href: string;
  label: string;
  why: string;
  whyHe: string;
}

type Step = Analysis["next_steps"][number];

const FIXED: Record<Exclude<Step["kind"], "say" | "mistake">, { href: string; label: string }> = {
  cards: { href: "/words", label: "Word cards" },
  listen: { href: "/listen#stories", label: "A listening story" },
  talk: { href: "/talk", label: "One-minute talk" },
  review: { href: "/review", label: "Quick review" },
};

/**
 * Turn the report's next steps into links. The model can only name a kind and a target; a
 * Say it set or a mistake it made up is dropped here rather than sent to a missing page.
 */
export function stepLinks(steps: Analysis["next_steps"] | undefined, state: Pick<LearnerState, "errors">): StepLink[] {
  const out: StepLink[] = [];
  const seen = new Set<string>();
  for (const s of steps ?? []) {
    let link: { href: string; label: string } | null = null;
    if (s.kind === "say") {
      const set = saySetById(s.target);
      if (set) link = { href: `/say/${set.id}`, label: `Say it: ${set.title}` };
    } else if (s.kind === "mistake") {
      const e = state.errors[s.target];
      if (e) link = { href: `/mistakes/${encodeURIComponent(e.key)}`, label: `Fix: ${e.title}` };
    } else {
      link = FIXED[s.kind];
    }
    if (!link || seen.has(link.href)) continue;
    seen.add(link.href);
    out.push({ ...link, why: s.why_en, whyHe: s.why_he });
  }
  return out;
}
