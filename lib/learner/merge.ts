/**
 * Merge two copies of the learner model (this device and the synced one). Pure and
 * symmetric, so it doesn't matter which side is "local": both devices end up with the
 * same state after one round trip, and nothing either side learned is lost.
 *
 *   sessions by id, phrases by text, mistakes by key, monthly counters by max.
 *
 * Counters (spend, Azure usage, listening XP) take the larger value rather than the sum,
 * because after the first sync both copies already include the shared history. That can
 * under-count when both devices are used before syncing, which is the safe side for XP and
 * close enough for a budget warning.
 */
import type { Card } from "ts-fsrs";
import type { ErrorRecord, LearnerState, ListeningState, PhraseRecord, SessionRecord } from "./model";

export function mergeStates(a: LearnerState, b: LearnerState): LearnerState {
  const resetAt = later(a.resetAt, b.resetAt);
  const after = (iso: string | undefined) => !resetAt || (iso ?? "") >= resetAt;

  const removedPhrases = mergeRecords(a.removed?.phrases, b.removed?.phrases, (x, y) => (x >= y ? x : y));
  const removedSessions = [...new Set([...(a.removed?.sessions ?? []), ...(b.removed?.sessions ?? [])])];

  const sessions = mergeBy([...a.sessions, ...b.sessions], (s) => s.id, betterSession)
    .filter((s) => after(s.startedAt) && !removedSessions.includes(s.id))
    .sort((x, y) => x.startedAt.localeCompare(y.startedAt) || x.id.localeCompare(y.id));

  const phrases = mergeBy([...a.phrases, ...b.phrases], (p) => p.text.toLowerCase(), mergePhrase)
    .filter((p) => {
      const gone = removedPhrases[p.text.toLowerCase()];
      return after(p.addedAt) && !(gone && gone >= p.addedAt);
    })
    .sort((x, y) => x.addedAt.localeCompare(y.addedAt) || x.text.localeCompare(y.text));

  const errors: Record<string, ErrorRecord> = {};
  for (const e of mergeBy([...Object.values(a.errors), ...Object.values(b.errors)], (e) => e.key, mergeError)) {
    if (after(e.lastSeen)) errors[e.key] = e;
  }

  const out: LearnerState = {
    v: 1,
    errors,
    phrases,
    sessions,
    spend: mergeRecords(a.spend, b.spend, Math.max),
  };
  const speechUsage = mergeOptional(a.speechUsage, b.speechUsage, (x, y) =>
    mergeRecords(x, y, (u, v) => ({
      ttsChars: Math.max(u.ttsChars, v.ttsChars),
      sttSeconds: Math.max(u.sttSeconds, v.sttSeconds),
    })),
  );
  if (speechUsage) out.speechUsage = speechUsage;
  const listening = mergeOptional(a.listening, b.listening, mergeListening);
  if (listening) out.listening = listening;
  const pronunciation = mergeOptional(a.pronunciation, b.pronunciation, (x, y) =>
    mergeRecords(x, y, (u, v) => ({
      best: Math.max(u.best, v.best),
      attempts: Math.max(u.attempts, v.attempts),
      lastAt: later(u.lastAt, v.lastAt)!,
    })),
  );
  if (pronunciation) out.pronunciation = pronunciation;
  if (resetAt) out.resetAt = resetAt;
  if (Object.keys(removedPhrases).length || removedSessions.length) {
    out.removed = {};
    if (Object.keys(removedPhrases).length) out.removed.phrases = removedPhrases;
    if (removedSessions.length) out.removed.sessions = removedSessions;
  }
  return out;
}

/** The copy that got further: has a report, ended, more turns, more fixes said aloud. */
function betterSession(x: SessionRecord, y: SessionRecord): SessionRecord {
  const rank = (s: SessionRecord) => [
    s.report ? 1 : 0,
    s.endedAt ? 1 : 0,
    s.turns.length,
    s.fixedAloud.length,
    s.reviewsDone ?? 0,
    s.xp,
  ];
  const rx = rank(x);
  const ry = rank(y);
  for (let i = 0; i < rx.length; i++) if (rx[i] !== ry[i]) return rx[i] > ry[i] ? x : y;
  return x;
}

function mergePhrase(x: PhraseRecord, y: PhraseRecord): PhraseRecord {
  const base = moreReviewed(x.card, y.card) === x.card ? x : y;
  const other = base === x ? y : x;
  return {
    ...base,
    // The later date wins so a phrase re-added after a delete isn't dropped by the old delete.
    addedAt: later(base.addedAt, other.addedAt)!,
    meaningEn: base.meaningEn || other.meaningEn,
    meaningHe: base.meaningHe || other.meaningHe,
    example: base.example ?? other.example,
    tag: base.tag ?? other.tag,
    usedCount: Math.max(x.usedCount ?? 0, y.usedCount ?? 0) || undefined,
  };
}

function mergeError(x: ErrorRecord, y: ErrorRecord): ErrorRecord {
  // Every analysis that touches a mistake adds to occurrences or correctUses, so the copy
  // with the higher total has seen more conversations and knows the current status. The
  // review card can move on its own (a warm-up without a conversation), so it's picked apart.
  const progress = (e: ErrorRecord) => e.occurrences + e.correctUses;
  const base =
    progress(x) !== progress(y)
      ? progress(x) > progress(y)
        ? x
        : y
      : (x.lastSeen ?? "") >= (y.lastSeen ?? "")
        ? x
        : y;
  const other = base === x ? y : x;
  const card = !base.card ? other.card : !other.card ? base.card : moreReviewed(base.card, other.card);
  const merged: ErrorRecord = { ...base, whyHe: base.whyHe || other.whyHe };
  if (card) merged.card = card;
  else delete merged.card;
  return merged;
}

function mergeListening(x: ListeningState, y: ListeningState): ListeningState {
  const base = x.rounds.length >= y.rounds.length ? x : y;
  return {
    ...base,
    xp: Math.max(x.xp, y.xp),
    heard: [...new Set([...x.heard, ...y.heard])],
  };
}

function moreReviewed(x: Card, y: Card): Card {
  if (x.reps !== y.reps) return x.reps > y.reps ? x : y;
  const lx = x.last_review ? new Date(x.last_review).getTime() : 0;
  const ly = y.last_review ? new Date(y.last_review).getTime() : 0;
  return lx >= ly ? x : y;
}

function mergeBy<T>(items: T[], key: (t: T) => string, pick: (x: T, y: T) => T): T[] {
  const map = new Map<string, T>();
  for (const it of items) {
    const k = key(it);
    const prev = map.get(k);
    map.set(k, prev === undefined ? it : pick(prev, it));
  }
  return [...map.values()];
}

function mergeRecords<V>(
  x: Record<string, V> | undefined,
  y: Record<string, V> | undefined,
  pick: (u: V, v: V) => V,
): Record<string, V> {
  const out: Record<string, V> = { ...x };
  for (const [k, v] of Object.entries(y ?? {})) out[k] = k in out ? pick(out[k], v) : v;
  return out;
}

function mergeOptional<T>(x: T | undefined, y: T | undefined, both: (x: T, y: T) => T): T | undefined {
  if (x === undefined) return y;
  if (y === undefined) return x;
  return both(x, y);
}

function later(x: string | undefined, y: string | undefined): string | undefined {
  if (!x) return y;
  if (!y) return x;
  return x >= y ? x : y;
}
