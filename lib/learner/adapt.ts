/**
 * How the tutor adjusts to Hagai, worked out from his recent conversations and his answer
 * to "How did this week feel?". Nothing here is stored: it is recomputed from the sessions,
 * so it syncs for free and changes as he does.
 */
import { wordCount } from "@/lib/text/compare";
import { isRealSession, type LearnerState, type SessionRecord, type WeekFeeling } from "./model";
import { weekStart } from "./weekly";

export type TutorLevel = "easier" | "steady" | "stretch";

export interface Adaptation {
  level: TutorLevel;
  /** Why, in a few plain words each, to show him. */
  reasons: string[];
}

/** Conversations looked at: recent enough to follow him, enough not to swing on one bad day. */
const RECENT = 3;

function recent(state: LearnerState, n = RECENT): SessionRecord[] {
  return state.sessions.filter((s) => isRealSession(s) && s.endedAt && s.report).slice(-n);
}

interface Signals {
  learnerTurns: number;
  stuck: number;
  /** Asked to hear the tutor again, slower, or more simply. */
  lost: number;
  /** Words per spoken or typed answer. */
  wordsPerAnswer: number;
  /** Report fixes he said out loud, of the ones offered (at most 3 a conversation). */
  fixesSaid: number;
  fixesOffered: number;
  quietShare: number;
}

function signals(sessions: SessionRecord[]): Signals {
  let learnerTurns = 0;
  let words = 0;
  let answers = 0;
  for (const s of sessions) {
    for (const t of s.turns) {
      if (t.role !== "learner") continue;
      learnerTurns++;
      if (t.input === "stuck") continue;
      answers++;
      words += wordCount(t.text);
    }
  }
  const sum = (f: (s: SessionRecord) => number) => sessions.reduce((n, s) => n + f(s), 0);
  return {
    learnerTurns,
    stuck: sum((s) => s.stuckCount),
    lost: sum((s) => (s.help?.replay ?? 0) + (s.help?.simplify ?? 0)),
    wordsPerAnswer: answers ? words / answers : 0,
    fixesSaid: sum((s) => s.fixedAloud.length),
    fixesOffered: sum((s) => Math.min(3, s.report?.corrections.length ?? 0)),
    quietShare: sessions.length ? sessions.filter((s) => s.mode === "quiet").length / sessions.length : 0,
  };
}

/** His latest answer about how a week felt, from this week or the one before. */
export function latestFeeling(state: LearnerState, today: string): WeekFeeling | undefined {
  const thisWeek = weekStart(today);
  const lastWeek = weekStart(new Date(Date.parse(`${thisWeek}T12:00:00Z`) - 7 * 86_400_000).toISOString().slice(0, 10));
  return state.feelings?.[thisWeek] ?? state.feelings?.[lastWeek];
}

export function adaptation(state: LearnerState, today: string): Adaptation {
  const sessions = recent(state);
  const feeling = latestFeeling(state, today);
  const reasons: string[] = [];
  let score = 0;

  if (feeling === "hard") {
    score--;
    reasons.push("you said the week felt hard");
  } else if (feeling === "easy") {
    score++;
    reasons.push("you said the week felt easy");
  }

  if (sessions.length >= 2) {
    const s = signals(sessions);
    const turns = Math.max(1, s.learnerTurns);
    if (s.stuck / turns >= 0.25) {
      score--;
      reasons.push("you got stuck often lately");
    }
    if (s.lost / turns >= 0.3) {
      score--;
      reasons.push("you often asked to hear it again or simpler");
    }
    if (s.wordsPerAnswer >= 12 && s.stuck / turns < 0.1 && s.lost / turns < 0.15) {
      score++;
      reasons.push("your answers are long and smooth");
    }
  }

  const level: TutorLevel = score <= -1 ? "easier" : score >= 1 ? "stretch" : "steady";
  if (reasons.length === 0) {
    reasons.push(sessions.length < 2 ? "a few more conversations will tune it" : "it's going at a good pace");
  }
  return { level, reasons };
}

export interface LearningTip {
  title: string;
  body: string;
}

/**
 * One small change to try this week, from how he has been practicing. The most useful one
 * that applies, so it isn't a list of things to fix.
 */
export function learningTip(state: LearnerState): LearningTip | null {
  const sessions = recent(state, 5);
  if (sessions.length < 2) return null;
  const s = signals(sessions);
  const turns = Math.max(1, s.learnerTurns);

  if (s.stuck / turns >= 0.25) {
    return {
      title: "Getting stuck is part of it",
      body: "When a word won't come, tap I'm stuck and say it in Hebrew. Then say the English your tutor gives you out loud. Saying it yourself is what makes it stay.",
    };
  }
  if (s.wordsPerAnswer > 0 && s.wordsPerAnswer < 7) {
    return {
      title: "Add one more sentence",
      body: 'Your answers are short. After your first sentence, add a reason or an example: "because..." or "for example...". Longer answers are the fastest way to speaking freely.',
    };
  }
  if (s.fixesOffered >= 3 && s.fixesSaid / s.fixesOffered < 0.34) {
    return {
      title: "Say the fixes out loud",
      body: "Each report has up to 3 fixes. Saying each one out loud once takes about a minute, and that is where most of the learning sticks.",
    };
  }
  if (s.quietShare >= 0.5) {
    return {
      title: "Talk when you can",
      body: "Most recent conversations were typed. Typing helps, but speaking is the skill. When you can, even one spoken conversation a week makes a difference.",
    };
  }
  if (s.lost / turns >= 0.3) {
    return {
      title: "Use Slower before Repeat",
      body: "When you miss what was said, try Slower first and listen for the key words. If it's still unclear, tap What did they say? for a simpler version.",
    };
  }
  return {
    title: "Keep the rhythm",
    body: "Your practice is working. Try one plan word you haven't used yet in your next conversation.",
  };
}

/** Speech pace for the tutor's voice at this level (a gentle nudge on top of his setting). */
export function paceFor(level: TutorLevel): number {
  return level === "easier" ? 0.92 : 1;
}
