/**
 * The learner model: everything the app remembers about Hagai, as plain data plus pure
 * functions. The browser keeps it in localStorage for now (lib/client/learner.ts); the
 * same shape moves to Supabase later, so nothing here touches storage.
 */
import { createEmptyCard, fsrs, Rating, type Card } from "ts-fsrs";
import { SEED_ERRORS, seedVariants } from "@/content/learner-seed";
import { SCENARIOS, scenarioById, type Scenario } from "@/content/scenarios";
import { voiceById } from "@/content/voices";
import type { Turn } from "@/lib/conversation/types";
import { ANSWER_PARTS, type Analysis } from "@/lib/prompts/analyzer";
import { bestStreak, computeStreak, dayKey } from "@/lib/game/streak";
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
  /** Later times he made it, newest last, so the warm-up can use his own sentences. */
  examples?: { wrong: string; better: string }[];
}

/** How many of his own sentences are kept per mistake. */
export const EXAMPLES_MAX = 6;

/** Add an example unless it's already there; the oldest falls off past the cap. */
export function addExample(
  list: { wrong: string; better: string }[] | undefined,
  ex: { wrong: string; better: string },
  primary?: string,
): { wrong: string; better: string }[] {
  const key = (s: string) => s.trim().toLowerCase();
  const all = list ?? [];
  if (!ex.wrong.trim() || !ex.better.trim()) return all;
  if ((primary && key(primary) === key(ex.better)) || all.some((e) => key(e.better) === key(ex.better))) return all;
  return [...all, ex].slice(-EXAMPLES_MAX);
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
  /** Added from a word pack (content/decks.ts): it waits for the word cards before reviews. */
  deck?: string;
  /** When he first studied it on a word card (for the daily new-card limit). */
  studiedAt?: string;
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
  /** A demo conversation (scripted tutor, no AI key). Never counts toward progress. */
  demo?: boolean;
  /** Started from the 12-week plan: which day ("w3d2"). See lib/learner/plan.ts. */
  planDay?: string;
  /** Help asked for during the conversation; the tutor adapts to it (lib/learner/adapt.ts). */
  help?: Partial<Record<HelpKind, number>>;
}

/** "replay" covers Repeat and Slower; the rest are the help chips. */
export type HelpKind = "replay" | "simplify" | "hint" | "better";
export type WeekFeeling = "easy" | "right" | "hard";

export interface LearnerState {
  v: 1;
  errors: Record<string, ErrorRecord>;
  phrases: PhraseRecord[];
  sessions: SessionRecord[];
  /** Spend per month ("2026-10"), summed from every provider call. */
  spend: Record<string, number>;
  /** Azure usage per month, to know when the free tier runs out. */
  speechUsage?: Record<string, { ttsChars: number; sttSeconds: number }>;
  listening?: ListeningState;
  /** Best pronunciation score per course unit. */
  pronunciation?: Record<string, { best: number; attempts: number; lastAt: string }>;
  /** Facts he shared in conversations, so the tutor can pick up where they left off. */
  memory?: MemoryItem[];
  /** How each week felt to him, by the Sunday it started ("2026-10-25"). */
  feelings?: Record<string, WeekFeeling>;
  /** Set by "Delete all". Sync drops anything older from other devices. */
  resetAt?: string;
  /** Set when a backup is restored: a "Delete all" from before it no longer applies. */
  restoredAt?: string;
  /** Deletions, kept so sync doesn't bring them back: phrase (lowercased) → when, and session ids. */
  removed?: { phrases?: Record<string, string>; sessions?: string[] };
}

export interface MemoryItem {
  text: string;
  day: string;
}

/** How many remembered facts are kept; older ones fall off. */
export const MEMORY_MAX = 12;
/** Days off in a row that don't break the streak. */
export const STREAK_REST_DAYS = 2;

export interface ListeningState {
  /** Playback speed he currently handles; the gym adapts it (i+1). */
  rate: number;
  correctStreak: number;
  xp: number;
  /** One entry per finished round. */
  rounds: { day: string; mode: "dictation" | "shadowing"; correct: number; total: number; rate: number }[];
  /** Item ids already heard, so rounds prefer new sentences. */
  heard: string[];
}

export const LISTENING_START: ListeningState = { rate: 0.9, correctStreak: 0, xp: 0, rounds: [], heard: [] };
export const LISTENING_RATE_MIN = 0.7;
export const LISTENING_RATE_MAX = 1.3;

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
  return !s.demo && s.turns.some((t) => t.role === "learner");
}

/** An interrupted conversation can be picked up where it stopped for this long. */
export const RESUME_WINDOW_MS = 2 * 60 * 60 * 1000;

/**
 * The latest conversation that was cut off (a call, a locked phone, the app closed) after
 * he said enough to learn from. Without this it would never get a report, its plan day
 * would not count, and its mistakes would not reach the warm-up.
 */
export function unfinishedSession(
  state: LearnerState,
  now = new Date(),
): { session: SessionRecord; resumable: boolean } | null {
  const last = [...state.sessions].reverse().find((s) => !s.demo);
  if (!last || last.endedAt || last.report) return null;
  if (last.turns.filter((t) => t.role === "learner").length < 2) return null;
  const age = now.getTime() - new Date(last.startedAt).getTime();
  if (age > 7 * 24 * 60 * 60 * 1000) return null;
  return { session: last, resumable: age < RESUME_WINDOW_MS };
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
      ? {
          ...prev,
          occurrences: prev.occurrences + 1,
          lastSeen: iso,
          whyHe: prev.whyHe || c.why_he,
          examples: addExample(prev.examples, { wrong: c.original, better: c.better }, prev.better),
        }
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
    errors[key] = {
      ...e,
      cleanSessions: 0,
      status: e.status === "mastered" ? "practicing" : e.status,
      // Making it again while speaking outweighs a correct answer in a drill: it comes back in
      // the very next warm-up instead of waiting out a long review interval.
      ...(e.card ? { card: { ...e.card, due: now } } : {}),
    };
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
  const day = sessions.find((s) => s.id === sessionId)?.day ?? iso.slice(0, 10);
  return { ...state, errors, phrases, sessions, memory: rememberFacts(state.memory ?? [], analysis.memory, day) };
}

/** Add new facts (newest last), replacing an older copy of the same fact, capped at MEMORY_MAX. */
export function rememberFacts(memory: MemoryItem[], facts: string[], day: string): MemoryItem[] {
  const fresh = facts.map((f) => f.trim()).filter(Boolean);
  if (!fresh.length) return memory;
  const keys = new Set(fresh.map((f) => f.toLowerCase()));
  const kept = memory.filter((m) => !keys.has(m.text.toLowerCase()));
  return [...kept, ...fresh.map((text) => ({ text, day }))].slice(-MEMORY_MAX);
}

/** What the tutor gets: the newest few facts, newest first. */
export function memoryForTutor(state: LearnerState, max = 4): string[] {
  return (state.memory ?? [])
    .slice(-max)
    .reverse()
    .map((m) => m.text);
}

export function forgetFact(state: LearnerState, text: string): LearnerState {
  return { ...state, memory: (state.memory ?? []).filter((m) => m.text !== text) };
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
    .filter((s) => !s.demo)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
    .slice(0, 5)
    .map((s) => s.scenarioId);
  const listed = SCENARIOS.filter((s) => !s.hidden);
  const fits = listed.filter((s) => (top ? s.targets.includes(top.key) : true));
  const pool = fits.length ? fits : listed;
  return pool.find((s) => !recent.includes(s.id)) ?? pool[0];
}

/**
 * "Something different" after a conversation: a scenario from another category than the
 * ones just named, not done recently, so wanting more never means the same thing again.
 */
export function differentScenario(state: LearnerState, avoid: string[]): Scenario | null {
  const recent = new Set(
    state.sessions
      .filter((s) => !s.demo)
      .slice(-8)
      .map((s) => s.scenarioId),
  );
  const avoidCats = new Set(avoid.map((id) => scenarioById(id)?.category).filter(Boolean));
  const listed = SCENARIOS.filter((s) => !s.hidden && !avoid.includes(s.id));
  const fresh = listed.filter((s) => !recent.has(s.id));
  const pool = fresh.filter((s) => !avoidCats.has(s.category));
  const list = pool.length ? pool : fresh.length ? fresh : listed;
  if (!list.length) return null;
  // Rotates with the number of conversations, so it isn't always the first one in the list.
  return list[state.sessions.filter((s) => !s.demo).length % list.length];
}

export function minutesOnDay(state: LearnerState, day: string): number {
  const seconds = state.sessions.filter((s) => s.day === day && !s.demo).reduce((sum, s) => sum + s.speakingSeconds, 0);
  return Math.floor(seconds / 60);
}

export function statsFrom(state: LearnerState, today: string): LearnerStats {
  const real = state.sessions.filter(isRealSession);
  if (real.length === 0 && state.sessions.length === 0 && !state.listening?.xp) return { ...EMPTY_STATS };
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
    // The plan is 5 days a week, so two rest days in a row keep the streak alive.
    currentStreak: computeStreak(days, today, [], STREAK_REST_DAYS).current,
    bestStreak: bestStreak(days),
    mistakesMastered: Object.values(state.errors).filter((e) => e.status === "mastered").length,
    stuckFreeSessions: real.filter((s) => s.stuckCount === 0 && s.endedAt).length,
    interviewScenariosDone: interviewDone.size,
    accentsHeard: accents.size,
    xp: real.reduce((sum, s) => sum + s.xp, 0) + (state.listening?.xp ?? 0),
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

// Long-term mode: he practices once a day, so a right answer comes back in days, not in the
// ten-minute learning steps meant for flashcard apps used several times an hour (with those,
// every warm-up repeated the previous one).
const scheduler = fsrs({ enable_fuzz: false, enable_short_term: false });

/** Cards come back from JSON with dates as strings; FSRS needs Date objects. */
function reviveCard(card: Card): Card {
  return {
    ...card,
    due: new Date(card.due),
    ...(card.last_review ? { last_review: new Date(card.last_review) } : {}),
  };
}

/** A pack word he hasn't met on a card yet: not something to recall in a review. */
export function isUnstudied(p: PhraseRecord): boolean {
  return Boolean(p.deck) && p.card.reps === 0;
}

export function duePhrases(state: LearnerState, now = new Date(), max = 3): PhraseRecord[] {
  return state.phrases
    .filter((p) => new Date(p.card.due) <= now && !isUnstudied(p))
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

/** Word-card answer, Anki style: 1 again, 2 hard, 3 good, 4 easy. */
export type CardRating = 1 | 2 | 3 | 4;
const RATING: Record<CardRating, Rating.Again | Rating.Hard | Rating.Good | Rating.Easy> = {
  1: Rating.Again,
  2: Rating.Hard,
  3: Rating.Good,
  4: Rating.Easy,
};

export function ratePhrase(state: LearnerState, text: string, rating: CardRating, now = new Date()): LearnerState {
  return {
    ...state,
    phrases: state.phrases.map((p) =>
      p.text === text
        ? {
            ...p,
            card: scheduler.next(reviveCard(p.card), now, RATING[rating]).card,
            studiedAt: p.studiedAt ?? now.toISOString(),
          }
        : p,
    ),
  };
}

/** New pack words per day on the word cards; reviews are never capped. */
export const NEW_CARDS_PER_DAY = 10;

/**
 * Today's word cards: everything due (soonest first), then new pack words up to the daily
 * limit, in the order the packs list them. `deck` narrows it to one pack.
 */
export function cardQueue(
  state: LearnerState,
  now = new Date(),
  opts: { deck?: string; today?: string } = {},
): { due: PhraseRecord[]; fresh: PhraseRecord[] } {
  const inDeck = (p: PhraseRecord) => !opts.deck || p.deck === opts.deck;
  const due = state.phrases
    .filter((p) => inDeck(p) && !isUnstudied(p) && new Date(p.card.due) <= now)
    .sort((a, b) => new Date(a.card.due).getTime() - new Date(b.card.due).getTime());
  const today = opts.today ?? dayKey(now);
  const startedToday = state.phrases.filter(
    (p) => p.deck && p.studiedAt && dayKey(new Date(p.studiedAt)) === today,
  ).length;
  const room = Math.max(0, NEW_CARDS_PER_DAY - startedToday);
  const fresh = state.phrases.filter((p) => inDeck(p) && isUnstudied(p)).slice(0, room);
  return { due, fresh };
}

export function reviewMistake(state: LearnerState, key: string, good: boolean, now = new Date()): LearnerState {
  const e = state.errors[key];
  if (!e) return state;
  const card = scheduler.next(reviveCard(e.card ?? createEmptyCard(now)), now, good ? Rating.Good : Rating.Again).card;
  return { ...state, errors: { ...state.errors, [key]: { ...e, card } } };
}

/**
 * Which sentence to practice a mistake with this time. Each review moves to the next one:
 * the first sentence, then his own later sentences, then prepared ones with the same
 * pattern. Saying a different sentence each time trains the rule, not one memorized line.
 */
export function practiceSentence(e: ErrorRecord): { wrong: string; better: string; own: boolean } {
  const pool = [
    { wrong: e.example, better: e.better, own: true },
    ...(e.examples ?? []).map((x) => ({ ...x, own: true })),
  ];
  for (const [wrong, better] of seedVariants(e.key)) {
    if (!pool.some((p) => p.better.toLowerCase() === better.toLowerCase())) pool.push({ wrong, better, own: false });
  }
  const sayable = pool.filter((p) => p.better && !/[=…]/.test(p.better));
  const list = sayable.length ? sayable : pool;
  return list[(e.card?.reps ?? 0) % list.length];
}

export type WarmupItem =
  | { kind: "phrase"; id: string; target: string; meaning: string; hebrew: string; interview?: boolean }
  | {
      kind: "mistake";
      id: string;
      target: string;
      wrong: string;
      why: string;
      whyHe: string;
      /** A prepared sentence with the same pattern, not one he said himself. */
      practice?: boolean;
    };

/**
 * The warm-up: up to `max` items, mistakes first (active recall: see the wrong sentence,
 * say the right one), then phrases whose review is due. Mastered mistakes and mistakes
 * reviewed recently (card not yet due) are skipped. Before the first real conversation
 * there is nothing to review yet, so the first session goes straight in.
 */
export function warmupItems(state: LearnerState, now = new Date(), max = 3): WarmupItem[] {
  if (!state.sessions.some(isRealSession)) return [];
  const mistakes: WarmupItem[] = rankedErrors(state)
    .filter((e) => !e.card || new Date(e.card.due) <= now)
    // Skip entries that are explanations rather than one sayable sentence.
    .filter((e) => e.better && !/[=…]/.test(e.better))
    // Two before a conversation (it's a warm-up); about half of a longer quick review.
    .slice(0, max <= 3 ? 2 : Math.ceil(max / 2))
    .map((e) => {
      const ex = practiceSentence(e);
      return {
        kind: "mistake",
        id: e.key,
        target: ex.better,
        wrong: ex.wrong,
        why: e.why,
        whyHe: e.whyHe,
        ...(ex.own ? {} : { practice: true }),
      };
    });
  const phrases: WarmupItem[] = duePhrases(state, now, max).map((p) => ({
    kind: "phrase",
    id: p.text,
    target: p.text.replace(/[….]+$/, ""),
    meaning: p.meaningEn,
    hebrew: p.meaningHe,
    ...(p.tag === "Interview" ? { interview: true } : {}),
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
    .filter((s) => !s.demo && s.report?.level && s.report.level.confidence !== "low")
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
  return state.sessions.some((s) => !s.demo && s.scenarioId === "placement" && s.report);
}

/** Average speaking speed across voice conversations, in words per minute. */
export function averageWpm(state: LearnerState, wordsOf: (text: string) => number): number | null {
  let words = 0;
  let seconds = 0;
  for (const s of state.sessions) {
    if (s.demo || s.mode !== "voice" || s.speakingSeconds < 20) continue;
    seconds += s.speakingSeconds;
    words += s.turns
      .filter((t) => t.role === "learner" && t.input !== "stuck")
      .reduce((n, t) => n + wordsOf(t.text), 0);
  }
  return seconds > 0 ? Math.round(words / (seconds / 60)) : null;
}

export function addPhrases(
  state: LearnerState,
  items: { text: string; meaningEn: string; meaningHe: string; example?: string; deck?: string }[],
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

export function removePhrase(state: LearnerState, text: string, now = new Date()): LearnerState {
  return {
    ...state,
    phrases: state.phrases.filter((p) => p.text !== text),
    removed: {
      ...state.removed,
      phrases: { ...state.removed?.phrases, [text.toLowerCase()]: now.toISOString() },
    },
  };
}

export function removeSession(state: LearnerState, id: string): LearnerState {
  const sessions = state.removed?.sessions ?? [];
  return {
    ...state,
    sessions: state.sessions.filter((s) => s.id !== id),
    removed: { ...state.removed, sessions: sessions.includes(id) ? sessions : [...sessions, id] },
  };
}

/**
 * Phrases the tutor should give him chances to use: due ones first, then the newest he has
 * used least. Imported phrases only become active vocabulary when he says them.
 */
export function phrasesToPractice(state: LearnerState, now = new Date(), max = 3): string[] {
  const due = duePhrases(state, now, max).map((p) => p.text);
  const rest = state.phrases
    // Pack words he hasn't met on a card yet would crowd out the ones he's learning.
    .filter((p) => !due.includes(p.text) && !isUnstudied(p))
    .sort((a, b) => (a.usedCount ?? 0) - (b.usedCount ?? 0) || b.addedAt.localeCompare(a.addedAt))
    .map((p) => p.text);
  return [...due, ...rest].slice(0, max);
}

/**
 * Did he say this phrase? Verbs saved as "to juggle" also count as "juggling", "juggled",
 * "juggles" (irregular forms like "took" are missed, which only undercounts).
 */
export function phraseUsedIn(text: string, phrase: string): boolean {
  const lower = text.toLowerCase();
  const core = phrase
    .toLowerCase()
    .replace(/[….!?]+$/, "")
    .trim();
  if (core.length < 3) return false;
  if (!core.startsWith("to ")) return lower.includes(core);
  const [verb, ...rest] = core.slice(3).split(/\s+/);
  const stem = verb.replace(/e$/, "");
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const forms = `(?:${esc(verb)}|${esc(verb)}s|${esc(verb)}es|${esc(stem)}ed|${esc(stem)}ing|${esc(verb)}d|${esc(verb)}ing)`;
  const tail = rest.length ? `\\s+${rest.map(esc).join("\\s+")}` : "";
  return new RegExp(`\\b${forms}${tail}\\b`).test(lower);
}

/** Count phrases he actually used in his own turns. */
export function markPhrasesUsed(state: LearnerState, learnerText: string): LearnerState {
  let changed = false;
  const phrases = state.phrases.map((p) => {
    if (phraseUsedIn(learnerText, p.text)) {
      changed = true;
      return { ...p, usedCount: (p.usedCount ?? 0) + 1 };
    }
    return p;
  });
  return changed ? { ...state, phrases } : state;
}

/**
 * Adaptive speed: three right in a row at the current speed moves it up 0.05; a miss moves
 * it down 0.05. That keeps listening a little above comfortable, which is where it improves.
 */
export function recordListening(state: LearnerState, itemId: string, correct: boolean): LearnerState {
  const l = state.listening ?? LISTENING_START;
  let rate = l.rate;
  let streak = correct ? l.correctStreak + 1 : 0;
  if (correct && streak >= 3) {
    rate = Math.min(LISTENING_RATE_MAX, Math.round((rate + 0.05) * 100) / 100);
    streak = 0;
  } else if (!correct) {
    rate = Math.max(LISTENING_RATE_MIN, Math.round((rate - 0.05) * 100) / 100);
  }
  return {
    ...state,
    listening: {
      ...l,
      rate,
      correctStreak: streak,
      xp: l.xp + (correct ? 5 : 0),
      heard: l.heard.includes(itemId) ? l.heard : [...l.heard, itemId],
    },
  };
}

export function finishListeningRound(
  state: LearnerState,
  round: { day: string; mode: "dictation" | "shadowing"; correct: number; total: number; rate: number },
): LearnerState {
  const l = state.listening ?? LISTENING_START;
  return { ...state, listening: { ...l, rounds: [...l.rounds, round] } };
}

/** Pick sentences for a round: unheard first, near his level, in a stable shuffled order. */
export function pickListeningItems<T extends { id: string }>(
  items: readonly T[],
  heard: string[],
  count: number,
  seed: number,
): T[] {
  const rand = (i: number) => {
    const x = Math.sin(seed * 9301 + i * 49297) * 233280;
    return x - Math.floor(x);
  };
  const shuffled = items
    .map((it, i) => ({ it, r: rand(i) }))
    .sort((a, b) => a.r - b.r)
    .map((x) => x.it);
  const fresh = shuffled.filter((i) => !heard.includes(i.id));
  const old = shuffled.filter((i) => heard.includes(i.id));
  return [...fresh, ...old].slice(0, count);
}

export function recordPronunciation(
  state: LearnerState,
  unitId: string,
  score: number,
  now = new Date(),
): LearnerState {
  const prev = state.pronunciation?.[unitId];
  return {
    ...state,
    pronunciation: {
      ...state.pronunciation,
      [unitId]: {
        best: Math.max(prev?.best ?? 0, Math.round(score)),
        attempts: (prev?.attempts ?? 0) + 1,
        lastAt: now.toISOString(),
      },
    },
  };
}

export interface InterviewReadiness {
  /** Interview scenarios with at least one report, out of all of them. */
  practiced: number;
  total: number;
  /** Average readiness (1–5) over the last three interview reports that scored it. */
  readiness: number | null;
  /** The answer part he leaves out most often in his last ten answers, if any is below 70%. */
  weakest: { key: (typeof ANSWER_PARTS)[number]["key"]; label: string; missing: string; rate: number } | null;
  answers: number;
}

export function interviewReadiness(state: LearnerState): InterviewReadiness {
  const interviewIds = new Set(SCENARIOS.filter((s) => s.category === "interview" && !s.hidden).map((s) => s.id));
  const reports = state.sessions.filter((s) => !s.demo && interviewIds.has(s.scenarioId) && s.report);
  const scored = reports.filter((s) => s.report!.interview).map((s) => s.report!.interview!);
  const recent = scored.slice(-3);
  const answers = scored.flatMap((i) => i.answers).slice(-10);
  let weakest: InterviewReadiness["weakest"] = null;
  if (answers.length >= 2) {
    for (const part of ANSWER_PARTS) {
      const rate = answers.filter((a) => a[part.key]).length / answers.length;
      if (rate < 0.7 && (!weakest || rate < weakest.rate))
        weakest = { key: part.key, label: part.label, missing: part.missing, rate };
    }
  }
  return {
    practiced: new Set(reports.map((s) => s.scenarioId)).size,
    total: interviewIds.size,
    readiness: recent.length
      ? Math.round((recent.reduce((n, i) => n + i.readiness, 0) / recent.length) * 10) / 10
      : null,
    weakest,
    answers: answers.length,
  };
}
