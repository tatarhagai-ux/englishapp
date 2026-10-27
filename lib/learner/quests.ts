/**
 * Today's three small quests (Duolingo-style), one per skill, so a day has a clear finish
 * line beyond the minutes: talk, recall words, listen. Worked out from what is already
 * stored (no new state): minutes from sessions, reviews from each card's last review and
 * the Say it sentences answered, and listening from rounds and stories.
 */
import { dayKey } from "@/lib/game/streak";
import { minutesOnDay, type LearnerState } from "./model";

export interface Quest {
  id: "talk" | "words" | "listen";
  title: string;
  done: number;
  target: number;
  href: string;
}

export const WORDS_TARGET = 5;

function reviewedOn(iso: string | Date | undefined, today: string): boolean {
  return Boolean(iso) && dayKey(new Date(iso!)) === today;
}

export function dailyQuests(state: LearnerState, today: string, goalMinutes: number): Quest[] {
  const reviews =
    state.phrases.filter((p) => reviewedOn(p.card.last_review, today)).length +
    Object.values(state.errors).filter((e) => reviewedOn(e.card?.last_review, today)).length +
    // "Say it in English" sentences answered today, right or missed, are fixes recalled too.
    Object.values(state.sayMisses ?? {}).filter((m) => reviewedOn(m.at, today)).length;
  const listened =
    (state.listening?.rounds.filter((r) => r.day === today).length ?? 0) +
    Object.values(state.stories ?? {}).filter((s) => reviewedOn(s.at, today)).length;
  return [
    {
      id: "talk",
      title: `Talk for ${goalMinutes} minutes`,
      done: Math.min(goalMinutes, minutesOnDay(state, today)),
      target: goalMinutes,
      href: "/",
    },
    {
      id: "words",
      title: `Recall ${WORDS_TARGET} words or fixes`,
      done: Math.min(WORDS_TARGET, reviews),
      target: WORDS_TARGET,
      href: "/words",
    },
    { id: "listen", title: "One listening story or round", done: Math.min(1, listened), target: 1, href: "/listen" },
  ];
}
