import { z } from "zod";
import type { ChatMessage } from "@/lib/providers/llm/types";
import { turn } from "@/lib/conversation/types";
import { LEARNER_PROFILE } from "./learner";

/**
 * In-conversation helpers. Each returns a small JSON object so the UI can render it
 * without guessing: hint (what could I say?), better (say my last sentence naturally),
 * simplify (what did they say?), translate (to Hebrew).
 */
export const assistRequest = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("hint"), history: z.array(turn).min(1).max(40), task: z.string().max(400) }),
  z.object({ mode: z.literal("better"), text: z.string().trim().min(1).max(600) }),
  z.object({ mode: z.literal("simplify"), text: z.string().trim().min(1).max(800) }),
  z.object({ mode: z.literal("translate"), text: z.string().trim().min(1).max(800) }),
  z.object({
    mode: z.literal("define"),
    items: z.array(z.string().trim().min(1).max(120)).min(1).max(30),
  }),
]);
export type AssistRequest = z.infer<typeof assistRequest>;

export const assistResult = {
  hint: z.object({ ideas: z.array(z.string().min(1)).min(1).max(3) }),
  better: z.object({ better: z.string().min(1), why_en: z.string().default(""), why_he: z.string().default("") }),
  simplify: z.object({ simple: z.string().min(1), hebrew: z.string().default("") }),
  translate: z.object({ hebrew: z.string().min(1) }),
  define: z.object({
    items: z
      .array(
        z.object({
          text: z.string().min(1),
          meaning_en: z.string().default(""),
          meaning_he: z.string().default(""),
          example: z.string().default(""),
        }),
      )
      .min(1),
  }),
} as const;

export function buildAssistMessages(req: AssistRequest): ChatMessage[] {
  const base = `You help an English learner during a live conversation. Return ONLY a JSON object.\n${LEARNER_PROFILE}`;
  switch (req.mode) {
    case "hint": {
      const lastTurns = req.history
        .slice(-6)
        .map((t) => `${t.role === "tutor" ? "OTHER PERSON" : "LEARNER"}: ${t.text}`)
        .join("\n");
      return [
        {
          role: "system",
          content: `${base}\nGive 2 or 3 short ways the learner could start his next reply (sentence starters of 4 to 10 words, B2 level, natural spoken English). Shape: {"ideas":["",""]}`,
        },
        { role: "user", content: `His task: ${req.task}\n\nConversation so far:\n${lastTurns}` },
      ];
    }
    case "better":
      return [
        {
          role: "system",
          content: `${base}\nRewrite what the learner said the way a native speaker would say it in conversation. Keep his meaning and roughly his length. If it is already natural, return it unchanged. Explain the main change in one short sentence in English and in Hebrew. Shape: {"better":"","why_en":"","why_he":""}`,
        },
        { role: "user", content: req.text },
      ];
    case "simplify":
      return [
        {
          role: "system",
          content: `${base}\nThe learner did not understand this. Say it again in simpler English (short sentences, common words), and give a natural Hebrew translation. Shape: {"simple":"","hebrew":""}`,
        },
        { role: "user", content: req.text },
      ];
    case "define":
      return [
        {
          role: "system",
          content: `${base}\nFor each English word or phrase, give a short plain-English meaning (max 12 words), a natural Hebrew translation, and one short example sentence he could say in conversation. Keep the original text exactly as given. Shape: {"items":[{"text":"","meaning_en":"","meaning_he":"","example":""}]}`,
        },
        { role: "user", content: req.items.map((i, n) => `${n + 1}. ${i}`).join("\n") },
      ];
    case "translate":
      return [
        {
          role: "system",
          content: `Translate the English text into natural, everyday Israeli Hebrew. Return ONLY JSON: {"hebrew":""}`,
        },
        { role: "user", content: req.text },
      ];
  }
}
