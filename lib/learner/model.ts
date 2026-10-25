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
  /** Review schedule for the warm-up ("say the correct version"). Created on first review. */
  card?: Card;
}

export interface PhraseRecord {
  text: string;
  meaningEn: string;
  meaningHe: string;
  addedAt: string;
  card: Card;
  /** Where it came from when imported, e.g. a book title or "AZ-900". */
  tag?: string;
  example?: string;
  /** Times he used it in a conversation. */
  usedCount?: number;
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
  /** Warm-up items reviewed before the conversation. */
  reviewsDone?: number;
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
  const listed = SCENARIOS.filter((s) => !s.hidden);
  const fits = listed.filter((s) => (top ? s.targets.includes(top.key) : true));
  const pool = fits.length ? fits : listed;
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
    reviewsDone: session.reviewsDone ?? 0,
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

export function reviewMistake(state: LearnerState, key: string, good: boolean, now = new Date()): LearnerState {
  const e = state.errors[key];
  if (!e) return state;
  const card = scheduler.next(reviveCard(e.card ?? createEmptyCard(now)), now, good ? Rating.Good : Rating.Again).card;
  return { ...state, errors: { ...state.errors, [key]: { ...e, card } } };
}

export type WarmupItem =
  | { kind: "phrase"; id: string; target: string; meaning: string; hebrew: string }
  | { kind: "mistake"; id: string; target: string; wrong: string; why: string; whyHe: string };

/**
 * The warm-up: up to `max` items, mistakes first (active recall: see the wrong sentence,
 * say the right one), then phrases whose review is due. Mastered mistakes and mistakes
 * reviewed recently (card not yet due) are skipped.
 */
export function warmupItems(state: LearnerState, now = new Date(), max = 3): WarmupItem[] {
  const mistakes: WarmupItem[] = rankedErrors(state)
    .filter((e) => !e.card || new Date(e.card.due) <= now)
    // Skip entries that are explanations rather than one sayable sentence.
    .filter((e) => e.better && !/[=…]/.test(e.better))
    .slice(0, 2)
    .map((e) => ({ kind: "mistake", id: e.key, target: e.better, wrong: e.example, why: e.why, whyHe: e.whyHe }));
  const phrases: WarmupItem[] = duePhrases(state, now, max).map((p) => ({
    kind: "phrase",
    id: p.text,
    target: p.text.replace(/[….]+$/, ""),
    meaning: p.meaningEn,
    hebrew: p.meaningHe,
  }));
  return [...mistakes, ...phrases].slice(0, max);
}

const CEFR_ORDER = ["A1", "A2", "B1", "B1+", "B2", "B2+", "C1", "C2"] as const;
export type Cefr = (typeof CEFR_ORDER)[number];

export interface LevelPoint {
  day: string;
  cefr: Cefr;
  placement: boolean;
}

/** Speaking level estimates over time; low-confidence guesses are left out. */
export function levelHistory(state: LearnerState): LevelPoint[] {
  return state.sessions
    .filter((s) => s.report?.level && s.report.level.confidence !== "low")
    .map((s) => ({ day: s.day, cefr: s.report!.level!.cefr, placement: s.scenarioId === "placement" }));
}

/**
 * Current speaking level: the median of the last five estimates, so one great or one bad
 * day doesn't swing it. Falls back to the placement quiz.
 */
export function currentSpeakingLevel(state: LearnerState, fallback: Cefr): Cefr {
  const recent = levelHistory(state)
    .slice(-5)
    .map((p) => CEFR_ORDER.indexOf(p.cefr));
  if (recent.length === 0) return fallback;
  const sorted = [...recent].sort((a, b) => a - b);
  return CEFR_ORDER[sorted[Math.floor((sorted.length - 1) / 2)]];
}

export function hasPlacement(state: LearnerState): boolean {
  return state.sessions.some((s) => s.scenarioId === "placement" && s.report);
}

/** Average speaking speed across voice conversations, in words per minute. */
export function averageWpm(state: LearnerState, wordsOf: (text: string) => number): number | null {
  let words = 0;
  let seconds = 0;
  for (const s of state.sessions) {
    if (s.mode !== "voice" || s.speakingSeconds < 20) continue;
    seconds += s.speakingSeconds;
    words += s.turns
      .filter((t) => t.role === "learner" && t.input !== "stuck")
      .reduce((n, t) => n + wordsOf(t.text), 0);
  }
  return seconds > 0 ? Math.round(words / (seconds / 60)) : null;
}

export function addPhrases(
  state: LearnerState,
  items: { text: string; meaningEn: string; meaningHe: string; example?: string }[],
  tag: string | undefined,
  now = new Date(),
): { state: LearnerState; added: number } {
  const known = new Set(state.phrases.map((p) => p.text.toLowerCase()));
  const fresh: PhraseRecord[] = [];
  for (const i of items) {
    const text = i.text.trim();
    if (!text || known.has(text.toLowerCase())) continue;
    known.add(text.toLowerCase());
    fresh.push({ ...i, text, tag: tag || undefined, addedAt: now.toISOString(), card: createEmptyCard(now) });
  }
  return { state: { ...state, phrases: [...state.phrases, ...fresh] }, added: fresh.length };
}

export function removePhrase(state: LearnerState, text: string): LearnerState {
  return { ...state, phrases: state.phrases.filter((p) => p.text !== text) };
}

/**
 * Phrases the tutor should give him chances to use: due ones first, then the newest he has
 * used least. Imported phrases only become active vocabulary when he says them.
 */
export function phrasesToPractice(state: LearnerState, now = new Date(), max = 3): string[] {
  const due = duePhrases(state, now, max).map((p) => p.text);
  const rest = state.phrases
    .filter((p) => !due.includes(p.text))
    .sort((a, b) => (a.usedCount ?? 0) - (b.usedCount ?? 0) || b.addedAt.localeCompare(a.addedAt))
    .map((p) => p.text);
  return [...due, ...rest].slice(0, max);
}

/** Count phrases he actually used in his own turns. */
export function markPhrasesUsed(state: LearnerState, learnerText: string): LearnerState {
  const lower = learnerText.toLowerCase();
  let changed = false;
  const phrases = state.phrases.map((p) => {
    const core = p.text
      .toLowerCase()
      .replace(/[….!?]+$/, "")
      .trim();
    if (core.length >= 3 && lower.includes(core)) {
      changed = true;
      return { ...p, usedCount: (p.usedCount ?? 0) + 1 };
    }
    return p;
  });
  return changed ? { ...state, phrases } : state;
}
