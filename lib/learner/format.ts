import { FORMATS, SURPRISE_TOPICS, formatById, surpriseTopicById, type ConversationFormat } from "@/content/formats";
import { LEVEL_RANK } from "@/content/challenges";
import type { TutorLevel } from "./adapt";
import { isRealSession, type LearnerState } from "./model";

/** Formats not repeated from this many recent conversations; topics from this many. */
const FORMAT_NO_REPEAT = 4;
const TOPIC_NO_REPEAT = 20;

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

function recent(state: LearnerState, key: "format" | "topic", n: number): string[] {
  return state.sessions
    .filter(isRealSession)
    .slice(-n)
    .map((s) => s[key])
    .filter((x): x is string => !!x);
}

/** Formats that suit his level, the ones he hasn't had lately first. */
export function formatOptions(state: LearnerState, level: TutorLevel): ConversationFormat[] {
  const used = recent(state, "format", FORMAT_NO_REPEAT);
  const fits = FORMATS.filter((f) => LEVEL_RANK[f.minLevel] <= LEVEL_RANK[level]);
  return [...fits.filter((f) => !used.includes(f.id)), ...fits.filter((f) => used.includes(f.id))];
}

/**
 * Today's format for this conversation: stable for the day (leaving and coming back
 * doesn't reshuffle it), not one of the last few, and the harder ones only when he's ready.
 */
export function pickFormat(
  state: LearnerState,
  opts: { level: TutorLevel; scenarioId: string; day: string },
): ConversationFormat | undefined {
  const used = recent(state, "format", FORMAT_NO_REPEAT);
  const options = formatOptions(state, opts.level);
  const fresh = options.filter((f) => !used.includes(f.id));
  const pool = fresh.length ? fresh : options;
  if (!pool.length) return undefined;
  // Mixed with how many conversations he's had, so two in one day differ.
  const n = state.sessions.filter(isRealSession).length;
  return pool[hash(`${opts.day}|${opts.scenarioId}|${n}|format`) % pool.length];
}

export function nextFormat(state: LearnerState, current: string | undefined, level: TutorLevel) {
  const options = formatOptions(state, level);
  if (!options.length) return undefined;
  return options[(options.findIndex((f) => f.id === current) + 1) % options.length];
}

/** A topic for the surprise conversation, not one of the last twenty. */
export function pickTopic(state: LearnerState, day: string): { id: string; title: string } {
  const used = recent(state, "topic", TOPIC_NO_REPEAT);
  const fresh = SURPRISE_TOPICS.filter((t) => !used.includes(t.id));
  const pool = fresh.length ? fresh : SURPRISE_TOPICS;
  const n = state.sessions.filter(isRealSession).length;
  return pool[hash(`${day}|${n}|topic`) % pool.length];
}

export function nextTopic(state: LearnerState, current: string | undefined): { id: string; title: string } {
  const used = recent(state, "topic", TOPIC_NO_REPEAT);
  const fresh = SURPRISE_TOPICS.filter((t) => !used.includes(t.id));
  const pool = fresh.length > 1 ? fresh : SURPRISE_TOPICS;
  return pool[(pool.findIndex((t) => t.id === current) + 1) % pool.length];
}

/** The tutor's instructions for a format on a theme, or "" when there is none. */
export function formatForTutor(formatId: string | undefined, theme: string): string {
  const f = formatById(formatId);
  return f
    ? `${f.tutor(theme)}\nKeep to this format for the whole conversation; it is what makes today different.`
    : "";
}

/** The theme a format is about: the surprise topic, or the conversation's own subject. */
export function themeFor(scenarioTitle: string, topicId?: string): string {
  return surpriseTopicById(topicId)?.title ?? scenarioTitle.toLowerCase();
}
