/**
 * Typical transfer patterns for Hebrew speakers learning English. The analyzer prompt gets
 * this list so it looks for these specifically, and the planner uses it to choose targets.
 * Sources: docs/research/02 section 8 (BoldVoice, Pronunciation Pro, Citizen Café, TAU and
 * Bar-Ilan work). Items marked inferred were reasoned, not sourced.
 */

export interface L1Pattern {
  key: string;
  area: "pronunciation" | "grammar" | "usage" | "prosody";
  pattern: string;
  example?: string;
  inferred?: boolean;
}

export const HEBREW_PATTERNS: readonly L1Pattern[] = [
  { key: "th_sounds", area: "pronunciation", pattern: "/θ/ and /ð/ replaced (think → tink/sink, this → dis/zis)" },
  { key: "w_v", area: "pronunciation", pattern: "w pronounced as v", example: "white → vite" },
  {
    key: "vowel_length",
    area: "pronunciation",
    pattern: "Short/long vowel pairs merged",
    example: "ship/sheep, full/fool",
  },
  { key: "dark_l_r", area: "pronunciation", pattern: "Hebrew uvular r and clear l used for English r and dark l" },
  { key: "flat_stress", area: "prosody", pattern: "Word and sentence stress too even; unstressed vowels not reduced" },
  {
    key: "intonation",
    area: "prosody",
    pattern: "Falling, flat intonation that can sound annoyed or abrupt to English ears",
  },
  {
    key: "present_tenses",
    area: "grammar",
    pattern: "One Hebrew present tense mapped onto simple, continuous and perfect",
    example: "I live here for ten years",
  },
  { key: "modal_to", area: "grammar", pattern: "Adding to after modals", example: "I must to go" },
  { key: "ing_overuse", area: "grammar", pattern: "Overusing -ing forms", example: "I am knowing him" },
  {
    key: "infinitive_offer",
    area: "usage",
    pattern: "Infinitive for offers",
    example: "To open the window? (Shall I open the window?)",
  },
  {
    key: "missing_be_do",
    area: "grammar",
    pattern: "Dropping is/are and do/does (no copula or do-support in Hebrew)",
    example: "He very smart. / You want coffee?",
    inferred: true,
  },
  {
    key: "articles",
    area: "grammar",
    pattern: "Missing or extra a/the (Hebrew has no indefinite article)",
    inferred: true,
  },
  {
    key: "prepositions",
    area: "usage",
    pattern: "Prepositions translated literally from Hebrew",
    example: "study to the test, at the internet, depend of",
    inferred: true,
  },
  {
    key: "word_order_modifier",
    area: "grammar",
    pattern: "Noun + of + modifier instead of modifier + noun",
    example: "course of Microsoft",
    inferred: true,
  },
  {
    key: "directness",
    area: "usage",
    pattern: "Bare imperatives where English expects softeners",
    example: "Send me the file.",
    inferred: true,
  },
];
