/**
 * The weekly summary and the speaking checks, worked out from sessions. Weeks run Sunday to
 * Saturday, as in Israel.
 */
import { PLAN_DAYS } from "@/content/plan";
import { PLACEMENT_ID } from "@/content/scenarios";
import { wordCount } from "@/lib/text/compare";
import { toDayNumber as dayNumber, weekStart } from "@/lib/game/streak";
import { isRealSession, type LearnerState, type SessionRecord } from "./model";

export { weekStart };

export interface WeekSummary {
  start: string;
  daysPracticed: number;
  minutesSpoken: number;
  conversations: number;
  planDays: number;
  /** Mistakes he said right out loud from his reports this week. */
  fixesSaidAloud: number;
}

function summarize(sessions: SessionRecord[], start: string): WeekSummary {
  const from = dayNumber(start);
  const inWeek = sessions.filter((s) => {
    const n = dayNumber(s.day);
    return n >= from && n < from + 7;
  });
  return {
    start,
    daysPracticed: new Set(inWeek.map((s) => s.day)).size,
    minutesSpoken: Math.round(inWeek.reduce((sum, s) => sum + s.speakingSeconds, 0) / 60),
    conversations: inWeek.filter((s) => s.report).length,
    planDays: new Set(inWeek.filter((s) => s.planDay && s.report).map((s) => s.planDay)).size,
    fixesSaidAloud: inWeek.reduce((sum, s) => sum + s.fixedAloud.length, 0),
  };
}

/** This week and last week, side by side. */
export function weeklySummary(state: LearnerState, today: string): { thisWeek: WeekSummary; lastWeek: WeekSummary } {
  const real = state.sessions.filter(isRealSession);
  const start = weekStart(today);
  const prev = new Date((dayNumber(start) - 7) * 86_400_000).toISOString().slice(0, 10);
  return { thisWeek: summarize(real, start), lastWeek: summarize(real, prev) };
}

export interface SpeakingCheck {
  day: string;
  sessionId: string;
  cefr?: string;
  /** Words a minute in his voice turns, when there is enough to measure. */
  wpm: number | null;
  /** Times he switched to Hebrew ("I'm stuck"). */
  stuck: number;
  /** Plan week this check closed (4, 8, 12), or null for the first one. */
  week: number | null;
}

/** The level checks (the first one and the plan's checks), oldest first, to compare. */
export function speakingChecks(state: LearnerState): SpeakingCheck[] {
  return state.sessions
    .filter((s) => !s.demo && s.scenarioId === PLACEMENT_ID && s.report)
    .sort((a, b) => a.startedAt.localeCompare(b.startedAt))
    .map((s) => {
      const words = s.turns
        .filter((t) => t.role === "learner" && t.input === "voice")
        .reduce((n, t) => n + wordCount(t.text), 0);
      const plan = s.planDay ? PLAN_DAYS.find((d) => d.key === s.planDay) : undefined;
      return {
        day: s.day,
        sessionId: s.id,
        cefr: s.report?.level?.cefr,
        wpm: s.mode === "voice" && s.speakingSeconds > 20 ? Math.round(words / (s.speakingSeconds / 60)) : null,
        stuck: s.stuckCount,
        week: plan?.week ?? null,
      };
    });
}
