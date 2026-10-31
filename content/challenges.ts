/**
 * Today's challenge: one twist per conversation that makes him work a little harder than
 * plain chatting. Research on speaking practice points the same way (pushed output, repeated
 * tasks with a new demand, "desirable difficulty"), with the caveat that too hard makes
 * people quit; so each challenge has a level, and an easier day gets an easier one.
 */
import type { TutorLevel } from "@/lib/learner/adapt";

export interface Challenge {
  id: string;
  /** Shown to him before the conversation. */
  title: string;
  task: string;
  taskHe: string;
  /** The lowest tutor level it suits. */
  minLevel: TutorLevel;
  /** How the tutor plays it in its own conversations. */
  tutor: string;
  /** How a roleplay character plays it; null when it doesn't fit a roleplay. */
  roleplay: string | null;
}

export const LEVEL_RANK: Record<TutorLevel, number> = { easier: 0, steady: 1, stretch: 2 };

export const CHALLENGES: readonly Challenge[] = [
  {
    id: "full-answers",
    title: "No one-liners",
    task: "Answer every question in at least two sentences: your answer, then a reason or an example.",
    taskHe: "כל תשובה לפחות שני משפטים: התשובה, ואז סיבה או דוגמה.",
    minLevel: "easier",
    tutor:
      "When he answers an open question in one short sentence, don't move on: ask why, how, or for an example, kindly but every time.",
    roleplay:
      "When he gives a very short answer, ask a natural follow-up that needs more (why, which one, when), as the character would.",
  },
  {
    id: "ban-basic-words",
    title: "Banned words",
    task: "Don't say very, good, nice or thing. Find a more precise word every time.",
    taskHe: "אסור להגיד very, good, nice או thing. כל פעם למצוא מילה מדויקת יותר.",
    minLevel: "easier",
    tutor:
      'The words very, good, nice and thing are banned for him today. When he uses one, point it out lightly in a few words ("Banned word! Another way to say good?") and let him rephrase, then continue. If he finds a strong word, say so.',
    roleplay: null,
  },
  {
    id: "storyteller",
    title: "Tell it as a story",
    task: "At least once, tell a real story: when it happened, what you did, and how it ended. Use past tenses.",
    taskHe: "לפחות פעם אחת לספר סיפור אמיתי: מתי זה קרה, מה עשית ואיך זה נגמר. בזמן עבר.",
    minLevel: "easier",
    tutor:
      "Ask one question that invites a real story from his life, and if his story has no ending or no details, ask for them (what happened next, how did it end).",
    roleplay: null,
  },
  {
    id: "dig-deeper",
    title: "Why, why, why",
    task: "Your tutor will ask why and how again and again. Give reasons and real examples.",
    taskHe: "המורה ישאל למה ואיך שוב ושוב. לתת סיבות ודוגמאות אמיתיות.",
    minLevel: "steady",
    tutor:
      "Go deep instead of wide: stay on one or two topics and ask at least three follow-ups that dig into reasons, consequences and examples. Don't jump to a new topic while there is more to dig.",
    roleplay:
      "As the character, ask at least two probing follow-ups that need a reason or a detail before you are satisfied.",
  },
  {
    id: "pushback",
    title: "Defend your opinion",
    task: "Your tutor will disagree with you. Stay polite, give a reason and an example, and don't give in too fast.",
    taskHe: "המורה לא יסכים איתך. להישאר מנומס, לתת סיבה ודוגמה, ולא לוותר מהר.",
    minLevel: "steady",
    tutor:
      "Ask for his opinion on something early, then respectfully disagree and argue the other side (at least twice in the conversation). Push for reasons. Concede only a point he really earns, and say what convinced you.",
    roleplay:
      "Be harder to convince than usual: raise one or two realistic objections he has to answer before you agree.",
  },
  {
    id: "curveball",
    title: "Expect a surprise",
    task: "Halfway through, something will change. Adapt, ask questions, and keep going.",
    taskHe: "באמצע משהו ישתנה. להסתגל, לשאול שאלות ולהמשיך.",
    minLevel: "steady",
    tutor:
      "About halfway through, bring in one realistic surprise that changes the situation (a plan falls through, a new problem, unexpected news) and see how he handles it.",
    roleplay:
      "About halfway through, bring in one realistic complication that fits the setting (a price changes, something is unavailable, a time moves) and see how he handles it.",
  },
  {
    id: "level-up",
    title: "Say it like a pro",
    task: "When your tutor asks, say the same idea again in more professional English.",
    taskHe: "כשהמורה מבקש, להגיד את אותו רעיון שוב באנגלית מקצועית יותר.",
    minLevel: "steady",
    tutor:
      'Two or three times, after he says something plain or casual, ask him to say it again as he would in a meeting or an interview ("How would you say that to a manager?"). If his new version is better, say what made it better in a few words; if not, offer one stronger phrase and let him try it.',
    roleplay: null,
  },
  {
    id: "describe-it",
    title: "Describe, don't translate",
    task: "If you can't find a word, describe it in English instead of switching to Hebrew.",
    taskHe: "אם חסרה מילה, לתאר אותה באנגלית במקום לעבור לעברית.",
    minLevel: "stretch",
    tutor:
      "When he searches for a word, don't hand it over at once: ask him to describe it (what it does, what it is like) and give the word only after he tries. Praise good descriptions; describing is a real speaking skill.",
    roleplay:
      "When he searches for a word, wait and ask what he means, so he explains it in other words, before you guess it.",
  },
];

export function challengeById(id: string | undefined): Challenge | undefined {
  return CHALLENGES.find((c) => c.id === id);
}
