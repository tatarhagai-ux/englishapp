/**
 * Achievements mark real milestones toward Hagai's goals (job interview, confident free
 * talk, life abroad). Each one is earned by doing, never by opening the app.
 */

export interface LearnerStats {
  totalSpeakingSeconds: number;
  sessions: number;
  currentStreak: number;
  bestStreak: number;
  mistakesMastered: number;
  /** Sessions finished without using "I'm stuck". */
  stuckFreeSessions: number;
  interviewScenariosDone: number;
  /** Distinct accents heard in roleplays (American, British, Australian, Indian). */
  accentsHeard: number;
  xp: number;
}

export const EMPTY_STATS: LearnerStats = {
  totalSpeakingSeconds: 0,
  sessions: 0,
  currentStreak: 0,
  bestStreak: 0,
  mistakesMastered: 0,
  stuckFreeSessions: 0,
  interviewScenariosDone: 0,
  accentsHeard: 0,
  xp: 0,
};

export interface Achievement {
  key: string;
  title: string;
  detail: string;
  /** 0..1 progress, so locked badges can show how close you are. */
  progress: (s: LearnerStats) => number;
}

const ratio = (value: number, target: number) => Math.min(1, Math.max(0, value / target));
const minutes = (s: LearnerStats) => s.totalSpeakingSeconds / 60;

export const ACHIEVEMENTS: readonly Achievement[] = [
  {
    key: "first_words",
    title: "First words",
    detail: "Finish your first conversation",
    progress: (s) => ratio(s.sessions, 1),
  },
  { key: "streak_3", title: "On a roll", detail: "Practice 3 days in a row", progress: (s) => ratio(s.bestStreak, 3) },
  {
    key: "streak_7",
    title: "One full week",
    detail: "Practice 7 days in a row",
    progress: (s) => ratio(s.bestStreak, 7),
  },
  {
    key: "streak_30",
    title: "Habit locked in",
    detail: "Practice 30 days in a row",
    progress: (s) => ratio(s.bestStreak, 30),
  },
  {
    key: "minutes_60",
    title: "First hour",
    detail: "Speak for 60 minutes in total",
    progress: (s) => ratio(minutes(s), 60),
  },
  {
    key: "minutes_300",
    title: "Five hours of talk",
    detail: "Speak for 300 minutes in total",
    progress: (s) => ratio(minutes(s), 300),
  },
  {
    key: "fix_1",
    title: "Fixed for good",
    detail: "Master your first recurring mistake",
    progress: (s) => ratio(s.mistakesMastered, 1),
  },
  {
    key: "fix_5",
    title: "Clean speaker",
    detail: "Master 5 recurring mistakes",
    progress: (s) => ratio(s.mistakesMastered, 5),
  },
  {
    key: "no_hebrew",
    title: "English all the way",
    detail: "Finish a conversation without “I'm stuck”",
    progress: (s) => ratio(s.stuckFreeSessions, 1),
  },
  {
    key: "interview_ready",
    title: "Interview ready",
    detail: "Complete all 5 job interview scenarios",
    progress: (s) => ratio(s.interviewScenariosDone, 5),
  },
  {
    key: "accents_4",
    title: "World ears",
    detail: "Talk with all 4 accents in roleplays",
    progress: (s) => ratio(s.accentsHeard, 4),
  },
];

export function earned(stats: LearnerStats): Set<string> {
  return new Set(ACHIEVEMENTS.filter((a) => a.progress(stats) >= 1).map((a) => a.key));
}
