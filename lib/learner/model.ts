/**
 * The learner model: everything the app remembers about Hagai, as plain data plus pure
 * functions. The browser keeps it in localStorage for now (lib/client/learner.ts); the
 * same shape moves to Supabase later, so nothing here touches storage.
 */
import { createEmptyCard, fsrs, Rating, type Card } from "ts-fsrs";
import { SEED_ERRORS } from "@/content/learner-seed";
import { SCENARIOS, scenarioById, type Scenario } from "@/content/scenarios";
import { voiceById } from "@/content/voices";
import type { Turn } from "@/lib/conversation/types";
import type { Analysis } from "@/lib/prompts/analyzer";
import { bestStreak, computeStreak } from "@/lib/game/streak";
import { EMPTY_STATS, type LearnerStats } from "@/lib/game/achievements";
import { xpForSession } from "@/lib/game/xp";

export type ErrorStatus = "new" | "practicing" | "mastered";

export interface ErrorRecord {
  key: string;
  title: string;
  category: string;
  example: string;
  better: string;
  why: string;
  whyHe: string;
  mission?: string;
  occurrences: number;
  correctUses: number;
  /** Consecutive sessions where he used it right and never got it wrong. Two in a row = mastered. */
  cleanSessions: number;
  status: ErrorStatus;
  lastSeen: string;
}

export interface PhraseRecord {
  text: string;
  meaningEn: string;
  meaningHe: string;
  addedAt: string;
  card: Card;
}

export interface SessionRecord {
  id: string;
  scenarioId: string;
  mode: "voice" | "quiet";
  startedAt: string;
  endedAt?: string;
  /** Calendar day in Israel time, for streaks and the daily goal. */
  day: string;
  turns: Turn[];
  speakingSeconds: number;
  stuckCount: number;
  report?: Analysis;
  /** Mistakes he said correctly out loud from the report ("Say it again"). */
  fixedAloud: string[];
  xp: number;
  costUsd: number;
}

export interface LearnerState {
  v: 1;
  errors: Record<string, ErrorRecord>;
  phrases: PhraseRecord[];
  sessions: SessionRecord[];
  /** Spend per month ("2026-10"), summed from every provider call. */
  spend: Record<string, number>;
  /** Azure usage per month, to know when the free tier runs out. */
  speechUsage?: Record<string, { ttsChars: number; sttSeconds: number }>;
}

export function initialState(now = new Date()): LearnerState {
  const iso = now.toISOString();
  const errors: Record<string, ErrorRecord> = {};
  for (const e of SEED_ERRORS) {
    errors[e.key] = {
      key: e.key,
      title: e.title,
      category: e.category,
      example: e.example,
      better: e.better,
      why: e.why,
      whyHe: "",
      mission: e.mission,
      occurrences: 1,
      correctUses: 0,
      cleanSessions: 0,
      status: "new",
      lastSeen: iso,
    };
  }
  return { v: 1, errors, phrases: [], sessions: [], spend: {} };
}

function humanize(key: string): string {
  const s = key.replace(/_/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** A session counts once it has at least one learner turn. */
export function isRealSession(s: SessionRecord): boolean {
  return s.turns.some((t) => t.role === "learner");
}

/**
 * Fold a finished conversation's analysis into the learner model. Pure: returns a new
 * state. Mistake status moves new → practicing (used correctly once) → mastered (two clean
 * sessions in a row); making it again drops a mastered item back to practicing.
 */
export function applyAnalysis(
  state: LearnerState,
  sessionId: string,
  analysis: Analysis,
  now = new Date(),
): LearnerState {
  const iso = now.toISOString();
  const errors = { ...state.errors };

  const madeKeys = new Set<string>();
  for (const c of analysis.corrections) {
    madeKeys.add(c.error_key);
    const prev = errors[c.error_key];
    errors[c.error_key] = prev
      ? { ...prev, occurrences: prev.occurrences + 1, lastSeen: iso, whyHe: prev.whyHe || c.why_he }
      : {
          key: c.error_key,
          title: humanize(c.error_key),
          category: c.category,
          example: c.original,
          better: c.better,
          why: c.why_en,
          whyHe: c.why_he,
          occurrences: 1,
          correctUses: 0,
          cleanSessions: 0,
          status: "new",
          lastSeen: iso,
        };
  }
  for (const o of analysis.other_errors) {
    madeKeys.add(o.error_key);
    const prev = errors[o.error_key];
    if (prev) errors[o.error_key] = { ...prev, occurrences: prev.occurrences + 1, lastSeen: iso };
  }

  for (const key of madeKeys) {
    const e = errors[key];
    errors[key] = { ...e, cleanSessions: 0, status: e.status === "mastered" ? "practicing" : e.status };
  }
  for (const key of new Set(analysis.correct_uses)) {
    const e = errors[key];
    if (!e || madeKeys.has(key)) continue;
    const cleanSessions = e.cleanSessions + 1;
    errors[key] = {
      ...e,
      correctUses: e.correctUses + 1,
      cleanSessions,
      status: cleanSessions >= 2 ? "mastered" : "practicing",
    };
  }

  const known = new Set(state.phrases.map((p) => p.text.toLowerCase()));
  const phrases = [...state.phrases];
  for (const p of analysis.phrases) {
    const text = p.text.trim();
    if (!text || known.has(text.toLowerCase())) continue;
    known.add(text.toLowerCase());
    phrases.push({ text, meaningEn: p.meaning_en, meaningHe: p.meaning_he, addedAt: iso, card: createEmptyCard(now) });
  }

  const sessions = state.sessions.map((s) => (s.id === sessionId ? { ...s, report: analysis } : s));
  return { ...state, errors, phrases, sessions };
}

/** Errors ranked by how much they need work: frequent, recent, and not yet mastered. */
export function rankedErrors(state: LearnerState): ErrorRecord[] {
  const weight: Record<ErrorStatus, number> = { new: 3, practicing: 1.5, mastered: 0 };
  return Object.values(state.errors)
    .filter((e) => e.status !== "mastered")
    .sort(
      (a, b) =>
        b.occurrences * weight[b.status] - a.occurrences * weight[a.status] || b.lastSeen.localeCompare(a.lastSeen),
    );
}

export function targetKeysForNext(state: LearnerState, max = 3): string[] {
  return rankedErrors(state)
    .slice(0, max)
    .map((e) => e.key);
}

/**
 * Today's recommended scenario: one that practices the top mistake, avoiding what was done
 * most recently so conversations don't repeat (the most common complaint about these apps).
 */
export function recommendScenario(state: LearnerState): Scenario {
  const [top] = rankedErrors(state);
  const recent = state.sessions
    .slice()
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
    .slice(0, 5)
    .map((s) => s.scenarioId);
  const fits = SCENARIOS.filter((s) => (top ? s.targets.includes(top.key) : true));
  const pool = fits.length ? fits : [...SCENARIOS];
  return pool.find((s) => !recent.includes(s.id)) ?? pool[0];
}

export function minutesOnDay(state: LearnerState, day: string): number {
  const seconds = state.sessions.filter((s) => s.day === day).reduce((sum, s) => sum + s.speakingSeconds, 0);
  return Math.floor(seconds / 60);
}

export function statsFrom(state: LearnerState, today: string): LearnerStats {
  const real = state.sessions.filter(isRealSession);
  if (real.length === 0 && state.sessions.length === 0) return { ...EMPTY_STATS };
  const days = real.map((s) => s.day);
  const interviewDone = new Set(
    real
      .filter((s) => s.report?.task.completed && scenarioById(s.scenarioId)?.category === "interview")
      .map((s) => s.scenarioId),
  );
  const accents = new Set(
    real
      .map((s) => scenarioById(s.scenarioId)?.voiceId)
      .filter((v): v is string => Boolean(v))
      .map((v) => voiceById(v)?.accent),
  );
  return {
    totalSpeakingSeconds: real.reduce((sum, s) => sum + s.speakingSeconds, 0),
    sessions: real.length,
    currentStreak: computeStreak(days, today).current,
    bestStreak: bestStreak(days),
    mistakesMastered: Object.values(state.errors).filter((e) => e.status === "mastered").length,
    stuckFreeSessions: real.filter((s) => s.stuckCount === 0 && s.endedAt).length,
    interviewScenariosDone: interviewDone.size,
    accentsHeard: accents.size,
    xp: real.reduce((sum, s) => sum + s.xp, 0),
  };
}

/** XP for a finished session, given the day's minutes before it (for the goal bonus). */
export function sessionXp(session: SessionRecord, minutesBefore: number, dailyGoalMinutes: number): number {
  const after = minutesBefore + Math.floor(session.speakingSeconds / 60);
  return xpForSession({
    speakingSeconds: session.speakingSeconds,
    missionComplete: Boolean(session.report?.task.completed),
    mistakesFixedAloud: session.fixedAloud.length,
    reviewsDone: 0,
    dailyGoalMet: minutesBefore < dailyGoalMinutes && after >= dailyGoalMinutes,
  });
}

// Spaced repetition ------------------------------------------------------------------------

const scheduler = fsrs({ enable_fuzz: false });

/** Cards come back from JSON with dates as strings; FSRS needs Date objects. */
function reviveCard(card: Card): Card {
  return {
    ...card,
    due: new Date(card.due),
    ...(card.last_review ? { last_review: new Date(card.last_review) } : {}),
  };
}

export function duePhrases(state: LearnerState, now = new Date(), max = 3): PhraseRecord[] {
  return state.phrases
    .filter((p) => new Date(p.card.due) <= now)
    .sort((a, b) => new Date(a.card.due).getTime() - new Date(b.card.due).getTime())
    .slice(0, max);
}

/** Record a review: "good" if he said it right, "again" if not. */
export function reviewPhrase(state: LearnerState, text: string, good: boolean, now = new Date()): LearnerState {
  return {
    ...state,
    phrases: state.phrases.map((p) =>
      p.text === text
        ? { ...p, card: scheduler.next(reviveCard(p.card), now, good ? Rating.Good : Rating.Again).card }
        : p,
    ),
  };
}
