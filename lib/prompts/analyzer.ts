import { z } from "zod";
import type { Scenario } from "@/content/scenarios";
import { SEED_ERRORS } from "@/content/learner-seed";
import { HEBREW_PATTERNS } from "@/content/l1/he";
import type { Turn } from "@/lib/conversation/types";
import type { ChatMessage } from "@/lib/providers/llm/types";
import { SAY_SETS } from "@/content/say";
import { LEARNER_PROFILE } from "./learner";

const keyField = z
  .string()
  .trim()
  .transform((s) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "")
      .slice(0, 60),
  )
  .pipe(z.string().min(1));

const correction = z.object({
  original: z.string().min(1),
  better: z.string().min(1),
  why_en: z.string().min(1),
  why_he: z.string().default(""),
  error_key: keyField,
  category: z.string().default("grammar"),
  severity: z.coerce.number().int().min(1).max(3).catch(2),
});

const percent = z.coerce.number().min(0).max(100).transform(Math.round);

/** What the "next steps" can point to. Only these kinds are accepted; see lib/learner/steps.ts. */
export const STEP_KINDS = ["say", "mistake", "cards", "listen", "talk", "review"] as const;

const nextStep = z.object({
  kind: z.enum(STEP_KINDS),
  /** say: a set id. mistake: an error key. Empty for the others. */
  target: z.string().trim().max(80).default(""),
  why_en: z.string().trim().max(200).default(""),
  why_he: z.string().trim().max(200).default(""),
});

/**
 * The report the analyzer must return. Lenient where a model commonly slips (extra fields,
 * numbers as strings, missing optional parts), strict where the app depends on a value.
 */
export const analysisSchema = z.object({
  corrections: z.array(correction).max(6).default([]),
  other_errors: z
    .array(z.object({ error_key: keyField, original: z.string(), better: z.string() }))
    .max(15)
    .default([]),
  correct_uses: z.array(keyField).max(15).default([]),
  phrases: z
    .array(
      z.object({ text: z.string().min(1), meaning_en: z.string().default(""), meaning_he: z.string().default("") }),
    )
    .max(8)
    .default([]),
  task: z
    .object({
      completed: z.boolean().catch(false),
      met: z.array(z.string()).default([]),
      feedback_en: z.string().default(""),
    })
    .default({ completed: false, met: [], feedback_en: "" }),
  praise_en: z.string().default(""),
  /** His best English sentence in the conversation, as he said it (shown as a win). */
  best_sentence: z.string().max(300).catch("").default(""),
  /** Speaking level shown in this conversation. Optional: a short chat may not show enough. */
  level: z
    .object({
      cefr: z.enum(["A1", "A2", "B1", "B1+", "B2", "B2+", "C1", "C2"]),
      confidence: z.enum(["low", "medium", "high"]).catch("low"),
      note_en: z.string().default(""),
    })
    .optional()
    .catch(undefined),
  /** Short facts about his life worth remembering for the next conversation. */
  memory: z.array(z.string().trim().min(3).max(160)).max(4).catch([]).default([]),
  /** Facts already remembered that this conversation shows are out of date (exact text). */
  memory_drop: z.array(z.string().trim().min(3).max(160)).max(4).catch([]).default([]),
  /** One or two sentences: what the conversation was about and what he said that matters. */
  summary_en: z.string().trim().max(300).catch("").default(""),
  /** Four scores from 0 to 100; the total is worked out in code (see totalScore). */
  score: z
    .object({
      fluency: percent,
      accuracy: percent,
      range: percent,
      task: percent,
      note_en: z.string().trim().max(240).default(""),
    })
    .optional()
    .catch(undefined),
  /** How the conversation felt to the teacher, in plain words. */
  felt_en: z.string().trim().max(300).catch("").default(""),
  felt_he: z.string().trim().max(300).catch("").default(""),
  next_steps: z.array(nextStep).max(3).catch([]).default([]),
  /** One small task for before the next conversation. */
  homework: z
    .object({
      task_en: z.string().trim().min(3).max(240),
      task_he: z.string().trim().max(240).default(""),
    })
    .optional()
    .catch(undefined),
  /** Interview scenarios only: how each answer was built, and overall readiness. */
  interview: z
    .object({
      answers: z
        .array(
          z.object({
            question: z.string().default(""),
            direct: z.boolean().catch(false),
            example: z.boolean().catch(false),
            actions: z.boolean().catch(false),
            result: z.boolean().catch(false),
            tip_en: z.string().default(""),
            better_start: z.string().default(""),
          }),
        )
        .max(5)
        .default([]),
      readiness: z.coerce.number().int().min(1).max(5).catch(3),
      note_en: z.string().default(""),
    })
    .optional()
    .catch(undefined),
});

/** The four parts of a strong interview answer, in the order an interviewer listens for them. */
export const ANSWER_PARTS = [
  {
    key: "direct",
    label: "Answered directly",
    missing: "a direct answer up front",
    why: "Answer the question in your first sentence, then explain. Interviewers decide early whether you understood them.",
    whyHe: "עונים על השאלה כבר במשפט הראשון, ורק אחר כך מסבירים. מראיינים מחליטים מהר אם הבנת את השאלה.",
  },
  {
    key: "example",
    label: "Real example",
    missing: "a real example",
    why: "One true story with a time and place beats three general claims like “I'm a hard worker”.",
    whyHe: "סיפור אמיתי אחד, עם זמן ומקום, שווה יותר משלוש טענות כלליות כמו “אני עובד קשה”.",
  },
  {
    key: "actions",
    label: "Your actions (I)",
    missing: "what you did yourself",
    why: "Say “I did”, not only “we did”. They are hiring you, not your team.",
    whyHe: "אומרים “I did” ולא רק “we did”. מגייסים אותך, לא את הצוות.",
  },
  {
    key: "result",
    label: "Result or lesson",
    missing: "how it ended (result or lesson)",
    why: "End with what changed: a number, an outcome, or what you learned. Stories without an ending are forgotten.",
    whyHe: "מסיימים במה שהשתנה: מספר, תוצאה או מה למדת. סיפור בלי סוף נשכח.",
  },
] as const;

export type Analysis = z.infer<typeof analysisSchema>;

/** Weights for the total: how he said it matters a little more than what was ticked off. */
export function totalScore(score: NonNullable<Analysis["score"]>): number {
  return Math.round(score.fluency * 0.3 + score.accuracy * 0.3 + score.range * 0.2 + score.task * 0.2);
}

export function buildAnalyzerMessages(scenario: Scenario, history: Turn[], memory: string[] = []): ChatMessage[] {
  const known = SEED_ERRORS.map((e) => `${e.key}: ${e.title}`).join("\n");
  const patterns = HEBREW_PATTERNS.filter((p) => p.area !== "pronunciation" && p.area !== "prosody")
    .map((p) => `${p.key}: ${p.pattern}${p.example ? ` (e.g. "${p.example}"${p.fix ? ` → "${p.fix}"` : ""})` : ""}`)
    .join("\n");
  const transcript = history
    .map((t) =>
      t.role === "tutor" ? `TUTOR: ${t.text}` : `LEARNER${t.input === "stuck" ? " (in Hebrew, stuck)" : ""}: ${t.text}`,
    )
    .join("\n");

  const system = `You are an expert English teacher for Hebrew speakers. You analyze a practice conversation and return ONLY a JSON object.

${LEARNER_PROFILE}

Known recurring mistakes (reuse these error_key values when a mistake matches):
${known}

Typical Hebrew-speaker patterns to look for (use these keys for new mistakes when they fit):
${patterns}

Facts already remembered about him (copy exact text into memory_drop only if one is now untrue):
${memory.length ? memory.map((m) => `- ${m}`).join("\n") : "(none yet)"}

Rules:
- Only judge LEARNER lines. Lines marked "in Hebrew, stuck" are not errors; ignore them, but phrases the tutor offered there are good "phrases".
- The learner's lines come from speech recognition. Do not report punctuation, capitalization, or anything that is plausibly a recognition error.
- Never "correct" something that is already natural English. When unsure, leave it out.
- corrections: the 3 most useful fixes, most important first. "original" is his exact words, "better" is the natural version, "why_en" is one short plain-English sentence on why, "why_he" is the same explanation in natural Hebrew. severity: 3 = changes meaning or sounds clearly wrong, 2 = noticeable, 1 = minor.
- other_errors: any further mistakes, briefly, for tracking.
- correct_uses: error_key values of known mistakes he got RIGHT at least once in this conversation.
- phrases: up to 5 useful expressions from the tutor's lines or your corrections worth saving, with a short English meaning and a Hebrew translation.
- task: decide if he completed the task, list which success criteria he met (copy their wording), and give one sentence of feedback.
- praise_en: one specific thing he did well, quoting him if possible.
- best_sentence: his single best English sentence in this conversation (the most natural, or the most ambitious one he got right), copied as he said it; fix only obvious recognition slips. Empty if he said too little.
${
  scenario.category === "interview"
    ? `- interview: for each main interview question he answered (at most 5), judge his answer like a hiring manager: direct = he answered the actual question in his first sentence or two; example = he gave a concrete, real situation; actions = he said what HE did ("I", not only "we"); result = he ended with an outcome, a number, or a lesson. tip_en: the one change that would most improve that answer. better_start: a strong opening sentence in his own content, natural and spoken. readiness: 1 to 5, how ready these answers would sound in a real English interview (language and structure; 5 = ready). note_en: one sentence on what to practice next.
`
    : ""
}- memory: up to 4 short facts about him that a good teacher would remember and use next time, in English in the third person ("He has an AZ-900 exam in two weeks."). Plans, work, interests, opinions, and everyday numbers he mentioned (what something costs, how he worked out a price or a plan). Only things he actually said, never guesses. Skip health, religion, and account or ID numbers. Empty if nothing new.
- memory_drop: from the list of already remembered facts below, copy the exact text of any fact this conversation shows is no longer true (he finished it, changed his mind, said the opposite). Usually empty.
- level: his SPEAKING level as shown here (A1, A2, B1, B1+, B2, B2+, C1, C2), judged on range, accuracy, fluency and how well he handles harder questions. confidence is "low" if he said little. note_en: one sentence on what would move him up.

JSON shape:
{"corrections":[{"original":"","better":"","why_en":"","why_he":"","error_key":"","category":"grammar|vocabulary|preposition|word_order|discourse","severity":2}],"other_errors":[{"error_key":"","original":"","better":""}],"correct_uses":[""],"phrases":[{"text":"","meaning_en":"","meaning_he":""}],"task":{"completed":false,"met":[""],"feedback_en":""},"praise_en":"","best_sentence":"","memory":[""],"memory_drop":[""],"level":{"cefr":"B1+","confidence":"medium","note_en":""}${
    scenario.category === "interview"
      ? `,"interview":{"answers":[{"question":"","direct":true,"example":false,"actions":true,"result":false,"tip_en":"","better_start":""}],"readiness":3,"note_en":""}`
      : ""
  }}`;

  const user = `Scenario: ${scenario.title}
Task: ${scenario.task}
Success criteria:
${scenario.successCriteria.map((c) => `- ${c}`).join("\n")}

Transcript:
${transcript}`;

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

/** The fields the teacher's summary call returns (see buildCoachMessages). */
export const coachSchema = analysisSchema.pick({
  summary_en: true,
  score: true,
  felt_en: true,
  felt_he: true,
  next_steps: true,
  homework: true,
});
export type Coach = z.infer<typeof coachSchema>;

function transcriptOf(history: Turn[]): string {
  return history
    .map((t) =>
      t.role === "tutor" ? `TUTOR: ${t.text}` : `LEARNER${t.input === "stuck" ? " (in Hebrew, stuck)" : ""}: ${t.text}`,
    )
    .join("\n");
}

/**
 * The teacher's wrap-up: score, how it felt, what to do now, homework. A separate call from
 * the fixes, run at the same time, so neither reply is long enough to time out on a cheap
 * model; if this one fails the report still has its fixes.
 */
export function buildCoachMessages(scenario: Scenario, history: Turn[]): ChatMessage[] {
  const known = SEED_ERRORS.map((e) => `${e.key}: ${e.title}`).join("\n");
  const system = `You are an experienced, demanding but warm English teacher for Hebrew speakers. You just listened to a practice conversation. Write your wrap-up for the learner and return ONLY a JSON object.

${LEARNER_PROFILE}

Say it set ids (id: title):
${SAY_SETS.map((x) => `${x.id}: ${x.title}`).join("\n")}

Known mistake keys (for next_steps of kind "mistake"):
${known}

Rules:
- Only judge LEARNER lines. They come from speech recognition: ignore punctuation and plausible recognition errors. Lines marked "in Hebrew, stuck" are moments he could not find the words.
- summary_en: one or two sentences on what the conversation was about and anything he said that matters, for the teacher's own notes.
- score: fluency, accuracy, range and task, each 0 to 100, for THIS conversation. Be honest, not generous: 50 to 60 is a normal B1+ conversation, above 85 is rare. fluency = flow and little hesitation, accuracy = mistakes that matter relative to how much he said, range = variety of words and structures, task = how much of the task he completed. note_en: one sentence on what moved the score most.
- felt_en and felt_he: two or three sentences from the teacher's side, in plain words: where he flowed, where he got stuck or searched for a word, and one thing that stood out. Warm but real. The same text in natural Hebrew for felt_he.
- next_steps: up to 3 things to do right now, most useful first. Each has a kind: "say" (target = one of the Say it set ids listed above, the one that fits his biggest mistake), "mistake" (target = one of the known mistake keys above that he made in this conversation), "cards" (his word cards), "listen" (a listening story), "talk" (a one-minute talk), or "review" (quick review of old mistakes). why_en: one short reason that points at something he said in THIS conversation. why_he: the same in Hebrew.
- homework: one small, concrete task for before the next conversation, doable in five minutes, tied to a mistake or a goal from this conversation (for example: "Say three sentences about your week using for or since", or "Record one minute about your exam without saying very"). task_he: the same in Hebrew.
- Keep every text short. Hebrew must be natural, not a word-for-word translation.

JSON shape:
{"summary_en":"","score":{"fluency":60,"accuracy":60,"range":55,"task":70,"note_en":""},"felt_en":"","felt_he":"","next_steps":[{"kind":"say","target":"","why_en":"","why_he":""}],"homework":{"task_en":"","task_he":""}}`;

  const user = `Scenario: ${scenario.title}
Task: ${scenario.task}
Success criteria:
${scenario.successCriteria.map((c) => `- ${c}`).join("\n")}

Transcript:
${transcriptOf(history)}`;
  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

export function parseCoach(text: string): Coach | null {
  const raw = extractJson(text);
  if (raw === null || typeof raw !== "object") return null;
  const parsed = coachSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

/** Pull a JSON object out of a model reply, tolerating code fences and stray prose. */
export function extractJson(text: string): unknown {
  const unfenced = text.replace(/```(?:json)?/gi, "").trim();
  try {
    return JSON.parse(unfenced);
  } catch {
    const start = unfenced.indexOf("{");
    const end = unfenced.lastIndexOf("}");
    if (start === -1 || end <= start) return null;
    try {
      return JSON.parse(unfenced.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}

export function parseAnalysis(text: string): Analysis | null {
  const raw = extractJson(text);
  if (raw === null || typeof raw !== "object") return null;
  const parsed = analysisSchema.safeParse(raw);
  if (!parsed.success) return null;
  // Keep the top three, most severe first, and drop exact duplicates.
  const seen = new Set<string>();
  const corrections = parsed.data.corrections
    .filter((c) => c.original.trim() !== c.better.trim())
    .filter((c) => (seen.has(c.original) ? false : (seen.add(c.original), true)))
    .sort((a, b) => b.severity - a.severity)
    .slice(0, 3);
  return { ...parsed.data, corrections };
}
