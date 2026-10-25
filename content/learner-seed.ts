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
  },
  {
    key: "looking_forward_to_ing",
    category: "grammar",
    title: "looking forward to + -ing",
    example: "I'm looking forward to meet you.",
    better: "I'm looking forward to meeting you.",
    why: "Here “to” is a preposition, so the verb after it takes -ing.",
  },
  {
    key: "missing_be",
    category: "grammar",
    title: "Missing “is / are”",
    example: "An Azure exam that called AZ-900.",
    better: "An Azure exam that's called AZ-900.",
    why: "English needs a form of “be” in passive phrases like “is called”, even when it feels optional.",
  },
  {
    key: "study_for",
    category: "preposition",
    title: "study for a test",
    example: "I learn to the test.",
    better: "I'm studying for the exam.",
    why: "You “study for” an exam. “Learn” is about gaining a skill or fact, “study” is the activity.",
  },
  {
    key: "online_not_at_internet",
    category: "preposition",
    title: "online / on the internet",
    example: "Example tests at the internet.",
    better: "Practice tests online.",
    why: "Things are “on” the internet, and “online” is the most natural way to say it.",
  },
  {
    key: "noun_modifier_order",
    category: "word_order",
    title: "Brand before the noun",
    example: "An official course of Microsoft.",
    better: "An official Microsoft course.",
    why: "In English the describing noun comes first: a Microsoft course, a Google account.",
  },
  {
    key: "office_idioms",
    category: "vocabulary",
    title: "Everyday office phrases",
    example: "“Let's touch base” misunderstood as “let's finish”.",
    better: "touch base = briefly check in with each other.",
    why: "Workplace English runs on short idioms. We'll add a few to every work conversation.",
  },
  {
    key: "answer_all_parts",
    category: "discourse",
    title: "Answering every part of a question",
    example: "Answered what you did, skipped what you want to do next year.",
    better: "Last weekend I… And a year from now, I'd like to…",
    why: "When building sentences takes effort, the second half of a question gets lost. Interviews punish this.",
  },
];
