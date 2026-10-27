/**
 * Progress across the practice areas, for the Progress screen: how far he is in each, from
 * data already stored. "Steady" words are ones whose next review is at least three weeks
 * away, so they have come back right several times.
 */
import { STORIES } from "@/content/stories";
import { RADIO } from "@/content/radio";
import { READINGS } from "@/content/readings";
import { SAY_SETS } from "@/content/say";
import { MINUTE_TALK_ID } from "@/content/scenarios";
import { isUnstudied, type LearnerState } from "./model";

export interface SkillProgress {
  wordsStarted: number;
  wordsSteady: number;
  stories: { done: number; total: number };
  radio: { done: number; total: number };
  reads: { done: number; total: number };
  say: { done: number; total: number };
  minuteTalks: number;
}

const STEADY_DAYS = 21;

export function skillProgress(state: LearnerState): SkillProgress {
  const studied = state.phrases.filter((p) => p.card.reps > 0 && !isUnstudied(p));
  const steady = studied.filter(
    (p) =>
      new Date(p.card.due).getTime() - new Date(p.card.last_review ?? p.addedAt).getTime() >= STEADY_DAYS * 86_400_000,
  );
  const storyIds = new Set(STORIES.map((s) => s.id));
  const radioIds = new Set(RADIO.map((s) => s.id));
  const heard = Object.keys(state.stories ?? {});
  return {
    wordsStarted: studied.length,
    wordsSteady: steady.length,
    stories: { done: heard.filter((id) => storyIds.has(id)).length, total: STORIES.length },
    radio: { done: heard.filter((id) => radioIds.has(id)).length, total: RADIO.length },
    reads: { done: Object.keys(state.readings ?? {}).length, total: READINGS.length },
    say: { done: SAY_SETS.filter((s) => state.sayDrills?.[s.id]).length, total: SAY_SETS.length },
    minuteTalks: state.sessions.filter((s) => !s.demo && s.scenarioId === MINUTE_TALK_ID && s.report).length,
  };
}
