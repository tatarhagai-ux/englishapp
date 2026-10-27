/**
 * Starting point for Hagai's learner model, from the placement quiz and writing sample
 * done while planning (October 2026). These load as "new" errors on first run so the
 * tutor can target them from the very first conversation.
 */

export interface SeedError {
  key: string;
  category: "grammar" | "vocabulary" | "preposition" | "word_order" | "discourse";
  title: string;
  example: string;
  better: string;
  why: string;
  /** A concrete daily mission that makes the tutor elicit this structure. */
  mission: string;
  /**
   * More [wrong, right] sentences with the same pattern. The warm-up rotates through them so
   * he practices the rule, not one memorized sentence.
   */
  variants?: [string, string][];
}

/** The rotating practice sentences for a mistake key (empty when there are none). */
export function seedVariants(key: string): [string, string][] {
  return SEED_ERRORS.find((e) => e.key === key)?.variants ?? [];
}

export const PLACEMENT = {
  date: "2026-10-25",
  comprehension: "B2",
  production: "B1+",
  quizScore: "4/8",
} as const;

export const SEED_ERRORS: readonly SeedError[] = [
  {
    key: "present_perfect_duration",
    category: "grammar",
    title: "Present perfect for “how long”",
    example: "I live in Shoham for ten years.",
    better: "I've been living in Shoham for ten years.",
    why: "When something started in the past and is still true now, English uses the present perfect, not the present simple.",
    mission: "Say “I've been … for …” 3 times",
    variants: [
      ["I work in this office since March.", "I've been working in this office since March."],
      ["I know him for five years.", "I've known him for five years."],
      ["I study English for a long time.", "I've been studying English for a long time."],
      ["We wait here for twenty minutes.", "We've been waiting here for twenty minutes."],
      ["She is in the army for a year.", "She's been in the army for a year."],
      ["I use this app for two weeks.", "I've been using this app for two weeks."],
    ],
  },
  {
    key: "looking_forward_to_ing",
    category: "grammar",
    title: "looking forward to + -ing",
    example: "I'm looking forward to meet you.",
    better: "I'm looking forward to meeting you.",
    why: "Here “to” is a preposition, so the verb after it takes -ing.",
    mission: "Use “looking forward to + -ing” twice",
    variants: [
      ["I'm looking forward to see the results.", "I'm looking forward to seeing the results."],
      ["We look forward to hear from you.", "We look forward to hearing from you."],
      ["I'm looking forward to start the course.", "I'm looking forward to starting the course."],
      ["I'm looking forward to travel abroad next year.", "I'm looking forward to traveling abroad next year."],
      ["I look forward to work with you.", "I look forward to working with you."],
    ],
  },
  {
    key: "missing_be",
    category: "grammar",
    title: "Missing “is / are”",
    example: "An Azure exam that called AZ-900.",
    better: "An Azure exam that's called AZ-900.",
    why: "English needs a form of “be” in passive phrases like “is called”, even when it feels optional.",
    mission: "Describe 3 things with “it's called” or “it's used for”",
    variants: [
      ["The meeting moved to Thursday.", "The meeting's been moved to Thursday."],
      ["This app called Speakwise.", "This app is called Speakwise."],
      ["The report already sent.", "The report has already been sent."],
      ["The office closed on Fridays.", "The office is closed on Fridays."],
      ["The book written by a former FBI negotiator.", "The book was written by a former FBI negotiator."],
    ],
  },
  {
    key: "study_for",
    category: "preposition",
    title: "study for a test",
    example: "I learn to the test.",
    better: "I'm studying for the exam.",
    why: "You “study for” an exam. “Learn” is about gaining a skill or fact, “study” is the activity.",
    mission: "Explain how you study for something, in 3 sentences",
    variants: [
      ["I learn for the AZ-900 exam.", "I'm studying for the AZ-900 exam."],
      ["He learns at the university.", "He studies at the university."],
      ["I need to learn to the interview.", "I need to prepare for the interview."],
      ["We learned to the test all night.", "We studied for the test all night."],
      ["I learn English in an app every day.", "I practice English with an app every day."],
    ],
  },
  {
    key: "online_not_at_internet",
    category: "preposition",
    title: "online / on the internet",
    example: "Example tests at the internet.",
    better: "Practice tests online.",
    why: "Things are “on” the internet, and “online” is the most natural way to say it.",
    mission: "Say where you found something online, twice",
    variants: [
      ["I read about it at the internet.", "I read about it online."],
      ["I bought it in the internet.", "I bought it online."],
      ["I found the answer in Google.", "I found the answer on Google."],
      ["I saw it in YouTube.", "I saw it on YouTube."],
      ["The course is in the internet.", "The course is online."],
    ],
  },
  {
    key: "noun_modifier_order",
    category: "word_order",
    title: "Brand before the noun",
    example: "An official course of Microsoft.",
    better: "An official Microsoft course.",
    why: "In English the describing noun comes first: a Microsoft course, a Google account.",
    mission: "Name 3 tools the English way (a Microsoft course)",
    variants: [
      ["I have an account of Google.", "I have a Google account."],
      ["It's a phone of Samsung.", "It's a Samsung phone."],
      ["I took a test of English.", "I took an English test."],
      ["He works in a company of high tech.", "He works at a high-tech company."],
      ["I need a password of Wi-Fi.", "I need the Wi-Fi password."],
    ],
  },
  {
    key: "office_idioms",
    category: "vocabulary",
    title: "Everyday office phrases",
    example: "“Let's touch base” misunderstood as “let's finish”.",
    better: "touch base = briefly check in with each other.",
    why: "Workplace English runs on short idioms. We'll add a few to every work conversation.",
    mission: "Use 2 office phrases: touch base, follow up, on the same page",
  },
  {
    key: "answer_all_parts",
    category: "discourse",
    title: "Answering every part of a question",
    example: "Answered what you did, skipped what you want to do next year.",
    better: "Last weekend I… And a year from now, I'd like to…",
    why: "When building sentences takes effort, the second half of a question gets lost. Interviews punish this.",
    mission: "Answer two-part questions fully, 3 times",
  },
];
