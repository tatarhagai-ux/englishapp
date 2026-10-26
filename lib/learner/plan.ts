/**
 * Where he is in the 12-week plan, worked out from his sessions (each plan session carries
 * its day, e.g. "w3d2"). Nothing extra is stored, so it syncs and merges like everything
 * else. The next day is the first one not finished yet: going ahead on a free day is fine,
 * and a missed day just waits.
 */
import { PLAN, PLAN_DAYS, planWeek, type PlanDay, type PlanWeek, type StretchWord } from "@/content/plan";
import { addPhrases, type LearnerState, type SessionRecord } from "./model";

export type PlanDayInfo = PlanDay & { week: number; day: number };

/** A plan day counts once its conversation ended with a report. */
function finished(s: SessionRecord): boolean {
  return Boolean(s.planDay && !s.demo && s.endedAt && s.report);
}

export function completedPlanDays(state: LearnerState): Set<string> {
  return new Set(state.sessions.filter(finished).map((s) => s.planDay!));
}

export interface PlanPosition {
  /** The next day to do, or null when all 60 are done. */
  next: PlanDayInfo | null;
  /** The week to show: the next day's week, or the last week when finished. */
  week: PlanWeek;
  done: number;
  total: number;
  /** Which days of the shown week are done (by day number 1..5). */
  weekDone: boolean[];
  /** Plan days finished on this calendar day. */
  doneToday: number;
}

export function planPosition(state: LearnerState, today: string): PlanPosition {
  const done = completedPlanDays(state);
  const next = PLAN_DAYS.find((d) => !done.has(d.key)) ?? null;
  const week = planWeek(next?.week ?? PLAN.length)!;
  return {
    next,
    week,
    done: PLAN_DAYS.filter((d) => done.has(d.key)).length,
    total: PLAN_DAYS.length,
    weekDone: week.days.map((d) => done.has(d.key)),
    doneToday: new Set(state.sessions.filter((s) => finished(s) && s.day === today).map((s) => s.planDay)).size,
  };
}

/** How many times he has used a word in his own turns (counted in the phrase bank). */
export function wordUses(state: LearnerState, word: StretchWord): number {
  return state.phrases.find((p) => p.text.toLowerCase() === word.text.toLowerCase())?.usedCount ?? 0;
}

/** Two good uses in conversation make a word his. */
export const WORD_OWNED_USES = 2;

/** The week's words join the phrase bank (tagged "Week N"), so review and usage counting work. */
export function addWeekWords(state: LearnerState, week: PlanWeek, now = new Date()): LearnerState {
  return addPhrases(
    state,
    week.words.map((w) => ({ text: w.text, meaningEn: w.meaningEn, meaningHe: w.meaningHe, example: w.example })),
    `Week ${week.week}`,
    now,
  ).state;
}

/** Words the tutor should give him chances to use: this week's, least used first. */
export function weekWordsToPractice(state: LearnerState, week: PlanWeek, max = 3): string[] {
  return week.words
    .map((w) => ({ w, uses: wordUses(state, w) }))
    .filter((x) => x.uses < WORD_OWNED_USES)
    .sort((a, b) => a.uses - b.uses)
    .slice(0, max)
    .map((x) => x.w.text);
}

/** Stretch words he owns across the whole plan, for progress. */
export function ownedStretchWords(state: LearnerState): number {
  return PLAN.flatMap((w) => w.words).filter((w) => wordUses(state, w) >= WORD_OWNED_USES).length;
}
