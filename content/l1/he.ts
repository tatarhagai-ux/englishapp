/**
 * Typical transfer patterns for Hebrew speakers learning English. The analyzer prompt gets
 * this list so it looks for these specifically, the planner uses it to choose targets, and
 * the guide screen teaches it. Sources: docs/research/02 section 8 (BoldVoice, Pronunciation
 * Pro, Citizen Café, TAU and Bar-Ilan work). Items marked inferred were reasoned, not sourced.
 */

export interface L1Pattern {
  key: string;
  area: "pronunciation" | "grammar" | "usage" | "prosody";
  title: string;
  pattern: string;
  example?: string;
  /** The natural English version of the example. */
  fix?: string;
  /** One practical way to remember it. */
  tip: string;
  /** Why Hebrew leads here, in Hebrew. */
  whyHe: string;
  /** Pronunciation course unit that trains it, when there is one. */
  unit?: string;
  inferred?: boolean;
}

export const HEBREW_PATTERNS: readonly L1Pattern[] = [
  {
    key: "present_tenses",
    area: "grammar",
    title: "One present tense for three",
    pattern: "One Hebrew present tense mapped onto simple, continuous and perfect",
    example: "I live here for ten years.",
    fix: "I've been living here for ten years.",
    tip: "If it started in the past and is still true, and you say “for” or “since”, you need have/has.",
    whyHe: "בעברית יש הווה אחד, ובאנגלית שלושה. ״אני גר פה עשר שנים״ דורש present perfect.",
  },
  {
    key: "missing_be_do",
    area: "grammar",
    title: "Dropping is/are and do/does",
    pattern: "Dropping is/are and do/does (no copula or do-support in Hebrew)",
    example: "He very smart. / You want coffee?",
    fix: "He's very smart. / Do you want coffee?",
    tip: "Every English sentence needs a verb. Questions with a normal verb start with do/does/did.",
    whyHe: "בעברית אומרים ״הוא חכם״ בלי פועל, ושואלים רק בטון. באנגלית חייבים is ו-do.",
    inferred: true,
  },
  {
    key: "articles",
    area: "grammar",
    title: "a / the",
    pattern: "Missing or extra a/the (Hebrew has no indefinite article)",
    example: "I bought new phone. The life is hard.",
    fix: "I bought a new phone. Life is hard.",
    tip: "One countable thing mentioned for the first time gets “a”. General ideas (life, love, money) take nothing.",
    whyHe: "בעברית אין ״a״, ו-״ה״ הידיעה משמשת גם לדברים כלליים. באנגלית זה הפוך.",
    inferred: true,
  },
  {
    key: "prepositions",
    area: "usage",
    title: "Translated prepositions",
    pattern: "Prepositions translated literally from Hebrew",
    example: "I study to the test. It depends of the price. I saw it at the internet.",
    fix: "I'm studying for the test. It depends on the price. I saw it online.",
    tip: "Learn prepositions as part of the phrase: study for, depend on, good at, interested in, online.",
    whyHe: "״ללמוד למבחן״, ״תלוי ב...״: מילות היחס בעברית לא עוברות אחד לאחד לאנגלית.",
    inferred: true,
  },
  {
    key: "modal_to",
    area: "grammar",
    title: "No “to” after can/must/should",
    pattern: "Adding to after modals",
    example: "I must to go. You can to call me.",
    fix: "I must go. You can call me.",
    tip: "can, could, must, should, will, would, might: the verb comes straight after, no “to”.",
    whyHe: "בעברית ״צריך ללכת״, ״יכול להתקשר״ כוללים ״ל״, ובאנגלית אחרי פעלי עזר אין to.",
  },
  {
    key: "ing_overuse",
    area: "grammar",
    title: "Too much -ing",
    pattern: "Overusing -ing forms",
    example: "I am knowing him for years. I am liking it.",
    fix: "I've known him for years. I like it.",
    tip: "Know, like, want, need, believe, understand describe states, not actions, so they rarely take -ing.",
    whyHe: "בעברית אין הבדל בין ״אני יודע״ למשהו שקורה עכשיו, אז ing- מתפשט לכל מקום.",
  },
  {
    key: "infinitive_offer",
    area: "usage",
    title: "Offers with “Shall I”",
    pattern: "Infinitive for offers",
    example: "To open the window?",
    fix: "Shall I open the window? / Do you want me to open the window?",
    tip: "Offering to do something: “Shall I…?”, “Should I…?” or “Do you want me to…?”",
    whyHe: "״לפתוח את החלון?״ עובד בעברית, אבל באנגלית זה נשמע לא גמור.",
  },
  {
    key: "word_order_modifier",
    area: "grammar",
    title: "Describing word first",
    pattern: "Noun + of + modifier instead of modifier + noun",
    example: "A course of Microsoft. The office of my brother.",
    fix: "A Microsoft course. My brother's office.",
    tip: "In English the describing word or the owner comes before the noun: a Google account, Dana's car.",
    whyHe: "בעברית ״קורס של מיקרוסופט״, ״המשרד של אחי״. באנגלית המתאר בא לפני שם העצם.",
    inferred: true,
  },
  {
    key: "question_order",
    area: "grammar",
    title: "Question word order",
    pattern: "Statement word order in questions, and question order inside “tell me where…”",
    example: "Where you work? / Can you tell me where is the station?",
    fix: "Where do you work? / Can you tell me where the station is?",
    tip: "Real questions flip: Where DO you work? Inside another sentence (tell me, do you know) they go back to normal order: where the station IS.",
    whyHe: "בעברית שאלה היא משפט רגיל עם טון עולה. באנגלית צריך do והיפוך, ובתוך ״אתה יודע איפה…״ חוזרים לסדר רגיל.",
    inferred: true,
  },
  {
    key: "ever_perfect",
    area: "grammar",
    title: "“Have you ever…”",
    pattern: "Past simple for life experience (no time given) instead of present perfect",
    example: "Did you ever be in London? I never ate sushi.",
    fix: "Have you ever been to London? I've never eaten sushi.",
    tip: "Life experience with no “when”: have + the third form. Ever, never and before are the signal. Add a time (last year) and it goes back to the past.",
    whyHe: "בעברית ״היית פעם בלונדון?״ זה עבר רגיל. באנגלית ניסיון חיים בלי זמן מוגדר הוא present perfect.",
    inferred: true,
  },
  {
    key: "calques",
    area: "usage",
    title: "Word-for-word from Hebrew",
    pattern: "Hebrew expressions translated word for word",
    example: "Close the light. I took a decision. I have 25 years.",
    fix: "Turn off the light. I made a decision. I'm 25.",
    tip: "Some pairs just have to be learned as a unit: turn on/off a light, make a decision, make a mistake, I'm 25, I agree.",
    whyHe: "״לסגור את האור״, ״לקחת החלטה״, ״יש לי 25״: בעברית זה טבעי, ובאנגלית מילה במילה זה נשמע מוזר.",
    inferred: true,
  },
  {
    key: "directness",
    area: "usage",
    title: "Softening requests",
    pattern: "Bare imperatives where English expects softeners",
    example: "Send me the file. Give me a coffee.",
    fix: "Could you send me the file? Can I get a coffee, please?",
    tip: "Turn orders into questions: Could you…? Would you mind…? Can I get…? It costs two words and changes the whole tone.",
    whyHe: "ישירות ישראלית מתורגמת לאנגלית כגסות. ״תשלח לי״ צריך להפוך ל-Could you send me.",
    inferred: true,
  },
  {
    key: "th_sounds",
    area: "pronunciation",
    title: "TH sounds",
    pattern: "/θ/ and /ð/ replaced (think → tink/sink, this → dis/zis)",
    tip: "Tongue between the teeth. Soft for think, buzzing for this.",
    whyHe: "בעברית אין TH, אז הוא הופך ל-T, S, D או Z.",
    unit: "th-voiceless",
  },
  {
    key: "w_v",
    area: "pronunciation",
    title: "W and V",
    pattern: "w pronounced as v",
    example: "vite vine",
    fix: "white wine",
    tip: "Round your lips for W and keep your teeth away from your lip.",
    whyHe: "בעברית ו׳ היא V, ולכן W נבלעת.",
    unit: "w-v",
  },
  {
    key: "vowel_length",
    area: "pronunciation",
    title: "Long and short vowels",
    pattern: "Short/long vowel pairs merged",
    example: "ship/sheep, full/fool",
    tip: "Smile and stretch the long ones (sheep, fool); keep the short ones quick and relaxed.",
    whyHe: "בעברית אין הבדל באורך תנועות, אז ship ו-sheep נשמעים אותו דבר.",
    unit: "i-ee",
  },
  {
    key: "dark_l_r",
    area: "pronunciation",
    title: "R and L",
    pattern: "Hebrew uvular r and clear l used for English r and dark l",
    tip: "English R doesn't touch the throat: curl the tongue back slightly. The L at the end of “feel” is darker, with the back of the tongue raised.",
    whyHe: "ה-ר׳ העברית יוצאת מהגרון, וה-R האנגלית מתגלגלת בלשון בלי לגעת בשום מקום.",
  },
  {
    key: "flat_stress",
    area: "prosody",
    title: "Stress and weak vowels",
    pattern: "Word and sentence stress too even; unstressed vowels not reduced",
    tip: "Hit the stressed syllable hard and swallow the rest: buh-NA-nuh.",
    whyHe: "בעברית כל תנועה מבוטאת במלואה וההטעמה בסוף. באנגלית רוב התנועות מתכווצות.",
    unit: "schwa",
  },
  {
    key: "intonation",
    area: "prosody",
    title: "Melody",
    pattern: "Falling, flat intonation that can sound annoyed or abrupt to English ears",
    tip: "Let your voice go higher on polite questions and keep it soft at the end.",
    whyHe: "המנגינה הישראלית יורדת חד בסוף, ולאוזן אנגלית זה יכול להישמע עצבני או משועמם.",
    unit: "intonation",
  },
];
