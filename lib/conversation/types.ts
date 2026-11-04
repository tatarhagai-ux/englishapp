import { z } from "zod";
import { MOVES } from "./moves";

/** How the learner produced a turn: speech, typing (quiet mode), or Hebrew via "I'm stuck". */
export const turnInput = z.enum(["voice", "text", "stuck"]);
export type TurnInput = z.infer<typeof turnInput>;

export const correctionMode = z.enum(["off", "gentle", "precise"]);
export type CorrectionMode = z.infer<typeof correctionMode>;

export const turn = z.object({
  role: z.enum(["learner", "tutor"]),
  text: z.string().trim().min(1).max(1200),
  input: turnInput.optional(),
});
export type Turn = z.infer<typeof turn>;

/**
 * How much text of each kind the chat request accepts. The report and the memory produce
 * text up to these lengths, and the client cuts to them (see clampChat), so a long fact or
 * summary can never make every later request fail with "invalid request".
 */
export const CHAT_LIMITS = { fact: 240, recent: 520, homework: 400, opening: 300 } as const;

/** Cut text to a chat limit. */
export function clampChat(text: string, max: number): string {
  return text.length <= max ? text : text.slice(0, max - 1).trimEnd() + "…";
}

/** Body of POST /api/chat. The server is stateless: the client sends the context it needs. */
export const chatRequest = z.object({
  scenarioId: z.string().min(1).max(80),
  history: z.array(turn).max(80),
  correctionMode: correctionMode.default("gentle"),
  targetKeys: z.array(z.string().max(60)).max(5).default([]),
  /** Phrases he is learning; the tutor creates chances to use them. */
  practicePhrases: z.array(z.string().max(120)).max(5).default([]),
  tutorName: z.string().min(1).max(40).default("Ava"),
  /** Facts from earlier conversations, so the tutor can pick up where they left off. */
  memory: z.array(z.string().max(CHAT_LIMITS.fact)).max(12).default([]),
  /** One line per recent conversation, newest first: what it was about. */
  recent: z.array(z.string().max(CHAT_LIMITS.recent)).max(3).default([]),
  /** The first lines of his last few conversations: this one must not open like them. */
  avoidOpenings: z.array(z.string().max(CHAT_LIMITS.opening)).max(4).default([]),
  /** How to open this conversation (lib/conversation/moves.ts), for the first line only. */
  style: z.string().max(40).optional(),
  /** Today's challenge id (content/challenges.ts). */
  challenge: z.string().max(40).optional(),
  /** The conversation's format and surprise topic ids (content/formats.ts). */
  format: z.string().max(40).optional(),
  topic: z.string().max(40).optional(),
  /** What kind of reply the tutor gives this turn (lib/conversation/moves.ts). */
  move: z.enum(MOVES).optional(),
  /** The conversation is just starting: write a fresh first line instead of the scripted one. */
  opening: z.boolean().optional(),
  /** Homework from the last report that he hasn't ticked off. */
  homework: z.string().max(CHAT_LIMITS.homework).optional(),
  /** Time is up: the tutor should close the conversation warmly. */
  wrapUp: z.boolean().default(false),
  /** How hard to pitch the English, from his recent conversations (lib/learner/adapt.ts). */
  level: z.enum(["easier", "steady", "stretch"]).default("steady"),
});
export type ChatRequest = z.infer<typeof chatRequest>;
