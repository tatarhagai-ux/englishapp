/**
 * Demo mode: a scripted tutor and a sample report, so the whole flow can be tried before
 * any AI key is connected. Nothing here calls a server or costs money, and demo sessions
 * never count toward progress (see isRealSession).
 */
import type { Scenario, ScenarioCategory } from "@/content/scenarios";
import { SEED_ERRORS } from "@/content/learner-seed";
import type { Turn } from "@/lib/conversation/types";
import { analysisSchema, type Analysis } from "@/lib/prompts/analyzer";

const REACTIONS = ["Oh, interesting.", "Got it, thanks.", "Nice, that makes sense.", "Okay, I see."];

const FOLLOW_UPS: Record<ScenarioCategory, string[]> = {
  interview: [
    "Can you give me a specific example of that?",
    "What did you personally do in that situation?",
    "And how did it turn out in the end?",
  ],
  free: [
    "How long have you been doing that?",
    "What's the hardest part so far?",
    "What are you planning to do next week?",
  ],
  work: [
    "What do you need from the team to move forward?",
    "When do you think it'll be ready?",
    "Is there anything blocking you right now?",
  ],
  abroad: [
    "Is there anything else I can help you with?",
    "Would that work for you?",
    "Do you have any other questions before we finish?",
  ],
  world: [
    "Why do you think that is?",
    "What would someone on the other side say?",
    "Has your opinion changed over time?",
  ],
};

/** How many learner turns a demo lasts before the tutor wraps up. */
export const DEMO_TURNS = 3;

/** The scripted tutor's next line. */
export function demoReply(scenario: Scenario, history: Turn[]): string {
  const learnerTurns = history.filter((t) => t.role === "learner").length;
  if (learnerTurns >= DEMO_TURNS) {
    return "That was great talking with you. In the real app, I'd now give you your report. Tap the X to see a sample one.";
  }
  const i = Math.max(0, learnerTurns - 1);
  const questions = FOLLOW_UPS[scenario.category];
  return `${REACTIONS[i % REACTIONS.length]} ${questions[i % questions.length]}`;
}

/**
 * A sample report shaped like a real one. The corrections come from Hagai's own level test,
 * so even the demo shows mistakes that are really his.
 */
export function demoAnalysis(scenario: Scenario, turns: Turn[]): Analysis {
  const said = turns.find((t) => t.role === "learner" && t.input !== "stuck")?.text ?? "";
  const picks = SEED_ERRORS.filter((e) => e.key === "present_perfect_duration" || e.key === "looking_forward_to_ing");
  return analysisSchema.parse({
    corrections: picks.map((e) => ({
      original: e.example,
      better: e.better,
      why_en: e.why,
      why_he: "",
      error_key: e.key,
      category: e.category,
      severity: 3,
    })),
    phrases: scenario.phrases.slice(0, 2).map((p) => ({ text: p, meaning_en: "A useful phrase for this situation" })),
    task: {
      completed: true,
      met: scenario.successCriteria.slice(0, 1),
      feedback_en: "This is a sample. With the AI connected, this line reacts to what you actually said.",
    },
    praise_en: said ? `You answered in full sentences: “${said.slice(0, 80)}”` : "You kept the conversation going.",
    best_sentence: said ? said.split(/(?<=[.!?])\s+/)[0].slice(0, 160) : "",
    level: { cefr: "B1+", confidence: "medium", note_en: "Sample estimate. The real one comes from your own words." },
    ...(scenario.category === "interview"
      ? {
          interview: {
            answers: [
              {
                question: scenario.opener,
                direct: true,
                example: true,
                actions: false,
                result: false,
                tip_en: "Say what you did yourself, then how it ended.",
                better_start: "Right now I'm serving in the IDF, and in my free time I build AI automations.",
              },
            ],
            readiness: 3,
            note_en: "Sample. The real report checks each of your answers.",
          },
        }
      : {}),
  });
}
