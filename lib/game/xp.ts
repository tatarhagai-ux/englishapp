/**
 * XP rewards effort that actually builds speaking skill: minutes spoken, finishing the
 * day's mission, fixing a mistake out loud, and reviews. Nothing is earned for tapping
 * around, so XP stays a fair picture of practice.
 */

export const XP_RULES = {
  perMinuteSpoken: 10,
  missionComplete: 20,
  mistakeFixedAloud: 15,
  reviewDone: 5,
  dailyGoalMet: 10,
} as const;

export interface SessionEffort {
  speakingSeconds: number;
  missionComplete: boolean;
  mistakesFixedAloud: number;
  reviewsDone: number;
  dailyGoalMet: boolean;
}

export function xpForSession(e: SessionEffort): number {
  const minutes = Math.floor(Math.max(0, e.speakingSeconds) / 60);
  return (
    minutes * XP_RULES.perMinuteSpoken +
    (e.missionComplete ? XP_RULES.missionComplete : 0) +
    Math.max(0, e.mistakesFixedAloud) * XP_RULES.mistakeFixedAloud +
    Math.max(0, e.reviewsDone) * XP_RULES.reviewDone +
    (e.dailyGoalMet ? XP_RULES.dailyGoalMet : 0)
  );
}

/** XP needed to go from level n to n+1 grows by 50 each level: 100, 150, 200, ... */
export function xpToNext(level: number): number {
  return 100 + (level - 1) * 50;
}

export function levelFromXp(xp: number): { level: number; intoLevel: number; needed: number } {
  let level = 1;
  let remaining = Math.max(0, Math.floor(xp));
  while (remaining >= xpToNext(level)) {
    remaining -= xpToNext(level);
    level++;
  }
  return { level, intoLevel: remaining, needed: xpToNext(level) };
}
