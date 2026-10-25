import { z } from "zod";

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

/** Body of POST /api/chat. The server is stateless: the client sends the context it needs. */
export const chatRequest = z.object({
  scenarioId: z.string().min(1).max(80),
  history: z.array(turn).max(80),
  correctionMode: correctionMode.default("gentle"),
  targetKeys: z.array(z.string().max(60)).max(5).default([]),
  /** Phrases he is learning; the tutor creates chances to use them. */
  practicePhrases: z.array(z.string().max(120)).max(5).default([]),
  tutorName: z.string().min(1).max(40).default("Ava"),
  /** Time is up: the tutor should close the conversation warmly. */
  wrapUp: z.boolean().default(false),
});
export type ChatRequest = z.infer<typeof chatRequest>;
