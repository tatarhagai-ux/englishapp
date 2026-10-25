/**
 * Streak counting on calendar days in the learner's timezone (dates as "YYYY-MM-DD").
 * A streak survives until the end of today, so practicing yesterday but not yet today
 * still shows the streak. One freeze can cover a single missed day per week.
 */

function toDayNumber(day: string): number {
  const [y, m, d] = day.split("-").map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

export function dayKey(date: Date, timeZone = "Asia/Jerusalem"): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

export interface StreakResult {
  current: number;
  practicedToday: boolean;
  /** Days covered by a freeze inside the current streak. */
  frozenDays: string[];
}

export function computeStreak(
  activeDays: Iterable<string>,
  today: string,
  freezeDays: Iterable<string> = [],
): StreakResult {
  const active = new Set([...activeDays].map(toDayNumber));
  const frozen = new Set([...freezeDays].map(toDayNumber));
  const t = toDayNumber(today);
  const practicedToday = active.has(t);

  let cursor = practicedToday ? t : t - 1;
  let current = 0;
  const frozenDays: string[] = [];
  while (active.has(cursor) || frozen.has(cursor)) {
    if (active.has(cursor)) current++;
    else frozenDays.push(new Date(cursor * 86_400_000).toISOString().slice(0, 10));
    cursor--;
  }
  return { current, practicedToday, frozenDays };
}

export function bestStreak(activeDays: Iterable<string>): number {
  const days = [...new Set([...activeDays].map(toDayNumber))].sort((a, b) => a - b);
  let best = 0;
  let run = 0;
  for (let i = 0; i < days.length; i++) {
    run = i > 0 && days[i] === days[i - 1] + 1 ? run + 1 : 1;
    best = Math.max(best, run);
  }
  return best;
}
