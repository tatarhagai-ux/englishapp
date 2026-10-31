"use client";

import { planDayByKey, planWeek } from "@/content/plan";
import { deckById } from "@/content/decks";
import { addWeekWords } from "@/lib/learner/plan";
import { useSyncExternalStore } from "react";
import {
  addPhrases,
  recordPronunciation,
  finishListeningRound,
  recordListening,
  markPhrasesUsed,
  removePhrase,
  removeSession,
  forgetFact,
  addFact,
  completeHomework,
  applyAnalysis,
  reviewMistake,
  initialState,
  minutesOnDay,
  reviewPhrase,
  sessionXp,
  type LearnerState,
  type HelpKind,
  type SessionRecord,
  type WeekFeeling,
  ratePhrase,
  recordStory,
  recordReading,
  recordSayDrill,
  recordSayMisses,
  markPerfectDay,
  type CardRating,
} from "@/lib/learner/model";
import type { Turn } from "@/lib/conversation/types";
import type { Analysis } from "@/lib/prompts/analyzer";
import { monthKey } from "@/lib/cost/budget";
import { backupSummary, parseBackup, restoreBackup, type BackupError } from "@/lib/learner/backup";
import { sttCostUsd, ttsCostUsd } from "@/lib/cost/pricing";
import { dayKey } from "@/lib/game/streak";
import { browserSpeechActive } from "./browser-speech";

/**
 * Browser copy of the learner model. One JSON blob in localStorage; small enough (a year
 * of daily sessions is well under a megabyte). It stays the source of truth on each device;
 * lib/client/sync.ts merges it with the copy in Supabase when sync is on.
 */
const KEY = "sw_learner_v1";
const listeners = new Set<() => void>();
let snapshot: LearnerState | null = null;
// The server render and the very first client render must match, so both use this.
const SERVER_STATE = initialState(new Date(0));

function load(): LearnerState {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as LearnerState;
      if (parsed?.v === 1) return parsed;
    }
  } catch {
    // Corrupt or unavailable storage: start fresh rather than crash.
  }
  return initialState();
}

function get(): LearnerState {
  snapshot ??= load();
  return snapshot;
}

function set(next: LearnerState) {
  snapshot = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Quota or private mode: keep it in memory for this visit.
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      snapshot = load();
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

/** For sync: hear about every local change. */
export function onLearnerChange(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useLearner(): LearnerState {
  return useSyncExternalStore(subscribe, get, () => SERVER_STATE);
}

/** True after hydration, so screens can avoid flashing the empty server state. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export const learner = {
  get,

  startSession(
    scenarioId: string,
    mode: SessionRecord["mode"],
    opener: string,
    demo = false,
    planDay?: string,
    challenge?: string,
  ): string {
    const now = new Date();
    const id = `${now.getTime().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const session: SessionRecord = {
      id,
      scenarioId,
      mode,
      startedAt: now.toISOString(),
      day: dayKey(now),
      turns: [{ role: "tutor", text: opener }],
      speakingSeconds: 0,
      stuckCount: 0,
      fixedAloud: [],
      xp: 0,
      costUsd: 0,
      ...(demo ? { demo: true } : {}),
      ...(planDay && !demo ? { planDay } : {}),
      ...(challenge && !demo ? { challenge } : {}),
    };
    let next: LearnerState = { ...get(), sessions: [...get().sessions, session] };
    // A plan day brings its week's words into the phrase bank (once), for review and counting.
    const week = planDay ? planWeek(planDayByKey(planDay)?.week ?? 0) : undefined;
    if (week && !demo) next = addWeekWords(next, week, now);
    set(next);
    return id;
  },

  /** He asked for help in a conversation (Repeat, Slower, Hint...). */
  noteHelp(id: string | null, kind: HelpKind) {
    if (!id) return;
    learner.updateSession(id, (s) => ({ ...s, help: { ...s.help, [kind]: (s.help?.[kind] ?? 0) + 1 } }));
  },

  /** His answer to "How did this week feel?" */
  setFeeling(week: string, feeling: WeekFeeling) {
    const state = get();
    set({ ...state, feelings: { ...state.feelings, [week]: feeling } });
  },

  updateSession(id: string, patch: (s: SessionRecord) => SessionRecord) {
    const state = get();
    set({ ...state, sessions: state.sessions.map((s) => (s.id === id ? patch(s) : s)) });
  },

  appendTurn(id: string, turn: Turn, speakingSeconds = 0) {
    if (turn.role === "learner" && turn.input !== "stuck") set(markPhrasesUsed(get(), turn.text));
    learner.updateSession(id, (s) => ({
      ...s,
      turns: [...s.turns, turn],
      speakingSeconds: s.speakingSeconds + speakingSeconds,
      stuckCount: s.stuckCount + (turn.input === "stuck" ? 1 : 0),
    }));
  },

  /** Swap the scripted first line for the fresh one the tutor actually said. */
  replaceOpener(id: string, text: string) {
    learner.updateSession(id, (s) =>
      s.turns.length === 1 && s.turns[0].role === "tutor" ? { ...s, turns: [{ role: "tutor", text }] } : s,
    );
  },

  finishSession(id: string) {
    learner.updateSession(id, (s) => ({ ...s, endedAt: s.endedAt ?? new Date().toISOString() }));
  },

  /** Remove a session that never got a learner turn (opened and abandoned). */
  discardSession(id: string) {
    set(removeSession(get(), id));
  },

  saveReport(id: string, analysis: Analysis, dailyGoalMinutes: number) {
    const state = applyAnalysis(get(), id, analysis);
    const session = state.sessions.find((s) => s.id === id);
    if (!session) return set(state);
    const before = minutesOnDay({ ...state, sessions: state.sessions.filter((s) => s.id !== id) }, session.day);
    const xp = sessionXp(session, before, dailyGoalMinutes);
    set({ ...state, sessions: state.sessions.map((s) => (s.id === id ? { ...s, xp } : s)) });
  },

  /** A demo report is shown but never folded into the learner model. */
  saveDemoReport(id: string, analysis: Analysis) {
    learner.updateSession(id, (s) => ({ ...s, report: analysis }));
  },

  markFixedAloud(id: string, errorKey: string, dailyGoalMinutes: number) {
    learner.updateSession(id, (s) =>
      s.fixedAloud.includes(errorKey) ? s : { ...s, fixedAloud: [...s.fixedAloud, errorKey] },
    );
    const state = get();
    const session = state.sessions.find((s) => s.id === id);
    if (!session) return;
    const before = minutesOnDay({ ...state, sessions: state.sessions.filter((s) => s.id !== id) }, session.day);
    learner.updateSession(id, (s) => ({ ...s, xp: sessionXp(s, before, dailyGoalMinutes) }));
  },

  addSpend(sessionId: string | null, usd: number) {
    if (!(usd > 0)) return;
    const state = get();
    const month = monthKey();
    set({
      ...state,
      spend: { ...state.spend, [month]: (state.spend[month] ?? 0) + usd },
      sessions: sessionId
        ? state.sessions.map((s) => (s.id === sessionId ? { ...s, costUsd: s.costUsd + usd } : s))
        : state.sessions,
    });
  },

  /** Azure usage: priced against this month's free tier, then added to spend. */
  addSpeechUsage(sessionId: string | null, usage: { ttsChars?: number; sttSeconds?: number }) {
    // The browser's own speech is free and isn't Azure usage.
    if (browserSpeechActive()) return;
    const state = get();
    const month = monthKey();
    const used = state.speechUsage?.[month] ?? { ttsChars: 0, sttSeconds: 0 };
    const ttsChars = usage.ttsChars ?? 0;
    const sttSeconds = usage.sttSeconds ?? 0;
    const cost = ttsCostUsd(ttsChars, used.ttsChars) + sttCostUsd(sttSeconds, used.sttSeconds);
    set({
      ...state,
      speechUsage: {
        ...state.speechUsage,
        [month]: { ttsChars: used.ttsChars + ttsChars, sttSeconds: used.sttSeconds + sttSeconds },
      },
    });
    learner.addSpend(sessionId, cost);
  },

  reviewPhrase(text: string, good: boolean) {
    set(reviewPhrase(get(), text, good));
  },

  recordStory(id: string, correct: number) {
    set(recordStory(get(), id, correct));
  },

  markPerfectDay(day: string) {
    const next = markPerfectDay(get(), day);
    if (next !== get()) set(next);
  },

  recordReading(id: string, correct: number) {
    set(recordReading(get(), id, correct));
  },

  recordSayDrill(id: string, correct: number) {
    set(recordSayDrill(get(), id, correct));
  },

  recordSayMisses(missed: string[], right: string[]) {
    set(recordSayMisses(get(), missed, right));
  },

  ratePhrase(text: string, rating: CardRating) {
    set(ratePhrase(get(), text, rating));
  },

  /** Add a word pack to the phrase bank; returns how many words were new. */
  addDeck(deckId: string): number {
    const deck = deckById(deckId);
    if (!deck) return 0;
    const r = addPhrases(
      get(),
      deck.words.map((w) => ({ ...w, deck: deck.id })),
      deck.title,
    );
    set(r.state);
    return r.added;
  },

  reviewMistake(key: string, good: boolean) {
    set(reviewMistake(get(), key, good));
  },

  addReviews(sessionId: string, count: number) {
    learner.updateSession(sessionId, (s) => ({ ...s, reviewsDone: (s.reviewsDone ?? 0) + count }));
  },

  addPhrases(items: { text: string; meaningEn: string; meaningHe: string; example?: string }[], tag?: string): number {
    const { state, added } = addPhrases(get(), items, tag);
    set(state);
    return added;
  },

  forgetFact(text: string) {
    set(forgetFact(get(), text));
  },

  addFact(text: string) {
    set(addFact(get(), text));
  },

  completeHomework(sessionId: string) {
    set(completeHomework(get(), sessionId));
  },

  removePhrase(text: string) {
    set(removePhrase(get(), text));
  },

  recordListening(itemId: string, correct: boolean) {
    set(recordListening(get(), itemId, correct));
  },

  finishListeningRound(round: Parameters<typeof finishListeningRound>[1]) {
    set(finishListeningRound(get(), round));
  },

  recordPronunciation(unitId: string, score: number) {
    set(recordPronunciation(get(), unitId, score));
  },

  exportJson(): string {
    return JSON.stringify(get(), null, 2);
  },

  /** Merge an exported backup into this device's copy. */
  restore(text: string): { summary: string } | { error: BackupError } {
    const parsed = parseBackup(text);
    if ("error" in parsed) return parsed;
    set(restoreBackup(get(), parsed.state));
    return { summary: backupSummary(parsed.state) };
  },

  /** Swap in a merged state from sync. */
  replace(next: LearnerState) {
    set(next);
  },

  reset() {
    const now = new Date();
    set({ ...initialState(now), resetAt: now.toISOString() });
  },
};
