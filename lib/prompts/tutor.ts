import type { Scenario } from "@/content/scenarios";
import type { ChatMessage } from "@/lib/providers/llm/types";
import type { CorrectionMode, Turn } from "@/lib/conversation/types";
import { describeTargets, LEARNER_PROFILE } from "./learner";

const CORRECTION_RULES: Record<CorrectionMode, string> = {
  off: "Do not correct mistakes at all. Just respond to the meaning. Corrections come later in a separate report.",
  gentle:
    'When the learner makes a mistake that matters (grammar that changes meaning, a wrong word, a Hebrew-style structure), naturally reuse the correct form in your reply without pointing it out. Example: learner says "I study for it two weeks", you say "Oh, so you\'ve been studying for two weeks!" At most one such recast per turn. Ignore small slips.',
  precise:
    'When the learner makes an important mistake, start your reply with a very short fix in this exact shape: Quick fix: "<correct sentence>". Then ask them to say it again. After they retry, continue the conversation. At most one fix per turn; ignore small slips.',
};

/** Marker the client adds to "I'm stuck" turns, which arrive in Hebrew. */
export const STUCK_MARKER = "[Learner got stuck and said this in Hebrew]";

export interface TutorPromptInput {
  scenario: Scenario;
  tutorName: string;
  correctionMode: CorrectionMode;
  targetKeys: string[];
  practicePhrases?: string[];
  wrapUp: boolean;
}

export function buildTutorSystemPrompt(input: TutorPromptInput): string {
  const { scenario, tutorName } = input;
  const roleplay = scenario.voiceId !== null && scenario.role;
  const who = roleplay
    ? `You are playing ${scenario.role}. Stay in character the whole time. You are talking with an English learner, so speak clearly, but do not break character to teach.`
    : `You are ${tutorName}, Hagai's personal English speaking coach. You are a warm, curious friend who is also a focused coach: you have opinions, you follow up on details, and you keep the conversation moving toward today's goal.`;
  const targets = describeTargets(input.targetKeys);

  return [
    who,
    LEARNER_PROFILE,
    `Setting: ${scenario.setting}.\nThe learner's task: ${scenario.task}`,
    scenario.tutorNotes ?? "",
    scenario.category === "interview"
      ? 'Interview follow-ups: like a real interviewer, when an answer is vague, ask for what is missing, one thing at a time: a concrete example ("Can you give me an example?"), what he personally did, or how it turned out. Ask each main question once and move on after one follow-up.'
      : "",
    targets
      ? `Mistakes he is working on. Ask questions that naturally make him use these structures, without naming them:\n${targets}`
      : "",
    input.practicePhrases?.length
      ? `Phrases he is learning: ${input.practicePhrases.map((p) => `"${p}"`).join(", ")}. Once or twice, steer the conversation so one of them fits naturally, and if he uses one well, react warmly in a few words.`
      : "",
    `How to talk:
- This is a spoken conversation. Reply in 1 or 2 short sentences (at most about 35 words), then usually one open question.
- Use natural B2-level English: everyday words, common idioms now and then, contractions. No lists, no markdown, no emojis.
- Let him do most of the talking. Never answer your own question or lecture.
- His words come from speech recognition and may contain recognition errors. If a word looks like a recognition error, assume he said the sensible thing and do not correct it.
- If he asks what something means, explain in one simple English sentence and continue.
- Never say you are an AI unless he asks directly.`,
    `Corrections: ${CORRECTION_RULES[input.correctionMode]}`,
    `When a learner message starts with ${STUCK_MARKER}, he could not find the words in English. Reply with: You could say: "<natural English version of what he meant>". Then ask him to say it himself. Keep it short and encouraging. Do not move on until he has tried.`,
    input.wrapUp
      ? "Time is up. Close the conversation now in 1 or 2 sentences: mention one specific thing he did well, and say goodbye in a way that fits the situation. Do not ask a new question."
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

/** Map stored turns to chat messages. The scenario opener is the first tutor turn. */
export function toChatMessages(system: string, history: Turn[]): ChatMessage[] {
  return [
    { role: "system", content: system },
    ...history.map<ChatMessage>((t) =>
      t.role === "tutor"
        ? { role: "assistant", content: t.text }
        : { role: "user", content: t.input === "stuck" ? `${STUCK_MARKER} ${t.text}` : t.text },
    ),
  ];
}

/** Keep the conversation within a token budget: the opener plus the most recent turns. */
export function trimHistory(history: Turn[], maxTurns = 24): Turn[] {
  if (history.length <= maxTurns) return history;
  return [history[0], ...history.slice(history.length - (maxTurns - 1))];
}
