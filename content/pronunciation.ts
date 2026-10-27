/**
 * Pronunciation course for Hebrew speakers. Each unit targets one known transfer problem
 * (docs/research/02 section 8: BoldVoice, Pronunciation Pro, Citizen Café). The goal is
 * being easy to understand, not sounding American: no unit punishes a legitimate accent.
 */

export interface PronunciationUnit {
  id: string;
  title: string;
  /** Short label used in lists. */
  focus: string;
  whyEn: string;
  whyHe: string;
  /** How to physically make the sound or pattern. */
  how: string;
  /** Word pairs that differ only in the target sound: [target, the Hebrew-speaker substitute]. */
  pairs: [string, string][];
  /** Sentences to say and get scored. */
  sentences: string[];
}

export const PRONUNCIATION: readonly PronunciationUnit[] = [
  {
    id: "th-voiceless",
    title: "The soft TH: think, three",
    focus: "/θ/",
    whyEn: "Hebrew has no TH, so it usually comes out as T or S: “tink” or “sink” instead of “think”.",
    whyHe: "בעברית אין את הצליל TH, אז הוא יוצא בדרך כלל כמו T או S: ״טינק״ או ״סינק״ במקום think.",
    how: "Put the tip of your tongue lightly between your teeth and blow air out gently. No voice, just air.",
    pairs: [
      ["think", "sink"],
      ["three", "tree"],
      ["thank", "tank"],
      ["path", "pass"],
      ["math", "mass"],
    ],
    sentences: [
      "I think it's the third time this month.",
      "Thanks for both of the things you sent.",
      "Three thousand people ran the marathon.",
    ],
  },
  {
    id: "th-voiced",
    title: "The buzzing TH: this, that",
    focus: "/ð/",
    whyEn:
      "The voiced TH in very common words (the, this, they) often becomes D or Z, which is the most noticeable Israeli accent marker.",
    whyHe:
      "ה-TH הקולי במילים נפוצות מאוד (the, this, they) הופך לעיתים קרובות ל-D או Z, וזה הסימן הכי בולט של מבטא ישראלי.",
    how: "Same tongue position as the soft TH, but turn your voice on so it buzzes.",
    pairs: [
      ["they", "day"],
      ["then", "den"],
      ["breathe", "breeze"],
      ["those", "doze"],
      ["though", "dough"],
    ],
    sentences: [
      "They said the other one is better.",
      "That's the thing about this weather.",
      "My brother and father live together.",
    ],
  },
  {
    id: "w-v",
    title: "W is not V",
    focus: "/w/",
    whyEn: "Hebrew speakers often turn W into V, so “white wine” sounds like “vite vine”.",
    whyHe: "דוברי עברית הופכים לעיתים W ל-V, כך ש-white wine נשמע כמו ״וייט וויין״.",
    how: "Round your lips like you're about to say “oo”, and don't let your top teeth touch your lip.",
    pairs: [
      ["west", "vest"],
      ["wine", "vine"],
      ["wet", "vet"],
      ["while", "vile"],
      ["worse", "verse"],
    ],
    sentences: [
      "We went west on Wednesday.",
      "Would you like white or red wine?",
      "What were you working on this week?",
    ],
  },
  {
    id: "i-ee",
    title: "Short i vs long ee: ship, sheep",
    focus: "/ɪ/ /iː/",
    whyEn:
      "Hebrew has one “i” sound, so ship and sheep, live and leave, sound the same. Some pairs are embarrassing to mix up.",
    whyHe: "בעברית יש צליל ״אי״ אחד, ולכן ship ו-sheep, או live ו-leave, נשמעים אותו דבר. חלק מהבלבולים האלה מביכים.",
    how: "Long ee: smile and stretch it. Short i: relax your mouth and make it quick, almost like a short ‘e’.",
    pairs: [
      ["ship", "sheep"],
      ["live", "leave"],
      ["fill", "feel"],
      ["sit", "seat"],
      ["it", "eat"],
    ],
    sentences: [
      "Please fill in the form before you leave.",
      "I live in a city with a big ship port.",
      "Do you feel it's a good fit?",
    ],
  },
  {
    id: "u-oo",
    title: "Short u vs long oo: full, fool",
    focus: "/ʊ/ /uː/",
    whyEn: "The same merge happens with u: full and fool, pull and pool sound alike.",
    whyHe: "אותו מיזוג קורה עם ״או״: full ו-fool, או pull ו-pool, נשמעים אותו דבר.",
    how: "Long oo: round and push your lips forward. Short u (book, good): lips relaxed, quick.",
    pairs: [
      ["full", "fool"],
      ["pull", "pool"],
      ["look", "Luke"],
      ["should", "shoed"],
    ],
    sentences: ["You should look at this good book.", "The pool is full on Sundays."],
  },
  {
    id: "a-e",
    title: "Bad vs bed",
    focus: "/æ/",
    whyEn: "The open “a” in bad, man, happy doesn't exist in Hebrew and often becomes “e”: “bed”, “men”.",
    whyHe: "ה-a הפתוחה ב-bad, man, happy לא קיימת בעברית, ולעיתים קרובות היא הופכת ל-e: ״bed״, ״men״.",
    how: "Drop your jaw lower than for “e” and spread your lips a little. It's a wider, flatter sound.",
    pairs: [
      ["bad", "bed"],
      ["man", "men"],
      ["sad", "said"],
      ["had", "head"],
    ],
    sentences: ["That man had a bad day.", "I'm happy we ran the plan past the team."],
  },
  {
    id: "schwa",
    title: "The lazy vowel: schwa",
    focus: "/ə/",
    whyEn:
      "English shrinks unstressed vowels to a quick “uh”. Hebrew speakers pronounce every vowel fully, which sounds robotic and slows you down.",
    whyHe:
      "באנגלית תנועות לא מוטעמות מתכווצות ל״אֶ״ קצר. דוברי עברית מבטאים כל תנועה במלואה, וזה נשמע רובוטי ומאט את הדיבור.",
    how: "Say the stressed syllable clearly and let the others fall to a quick, relaxed “uh”: baNAna = buh-NA-nuh.",
    pairs: [
      ["about", "a-BOUT"],
      ["problem", "PROB-lem"],
      ["Canada", "CA-na-da"],
    ],
    sentences: [
      "I'll be back in about a minute.",
      "There's a problem with the computer.",
      "It's a lot of fun to talk to you.",
    ],
  },
  {
    id: "word-stress",
    title: "Word stress",
    focus: "PHOtograph",
    whyEn:
      "Hebrew usually stresses the last syllable. English stress moves, and stressing the wrong syllable can make a word hard to recognize.",
    whyHe:
      "בעברית ההטעמה היא בדרך כלל בסוף המילה. באנגלית ההטעמה זזה, והטעמה במקום הלא נכון יכולה להפוך מילה ללא מזוהה.",
    how: "Make the stressed syllable longer, louder and higher. PHOtograph, phoTOgraphy, photoGRAPHic.",
    pairs: [
      ["deVElop", "DEvelop"],
      ["COMfortable", "comFORtable"],
      ["deVElopment", "developMENT"],
      ["PHOtograph", "photoGRAPH"],
    ],
    sentences: [
      "I'd like to develop a comfortable environment.",
      "The photographer took a beautiful photograph.",
      "We need to analyze the analysis.",
    ],
  },
  {
    id: "intonation",
    title: "Intonation: sounding friendly, not annoyed",
    focus: "melody",
    whyEn:
      "Israeli intonation is flatter and falls hard at the end. To English ears that can sound bored, annoyed or rude, even when you mean well.",
    whyHe:
      "האינטונציה הישראלית שטוחה יותר ויורדת חזק בסוף. לאוזן של דובר אנגלית זה יכול להישמע משועמם, עצבני או גס, גם כשהכוונה טובה.",
    how: "Let your voice go up and down more. Yes/no questions rise at the end. Polite requests start higher and stay soft.",
    pairs: [
      ["Could you send me the file? ↗", "Send me the file. ↘"],
      ["Really? ↗ (interested)", "Really. ↘ (bored)"],
    ],
    sentences: [
      "Could you send me the file when you get a chance?",
      "That sounds great, thanks so much!",
      "Sorry, would you mind repeating that?",
    ],
  },
  {
    id: "r-l",
    title: "The English R (and the dark L)",
    focus: "/r/ /ɫ/",
    whyEn:
      "The Hebrew R is made in the throat. In English that sounds heavy and foreign, and next to an L it can blur words like “right” and “light”.",
    whyHe: "ה-ר׳ העברית יוצאת מהגרון. באנגלית זה נשמע כבד וזר, וליד L זה יכול לטשטש מילים כמו right ו-light.",
    how: "For R, keep your throat relaxed: pull the tip of your tongue slightly back without touching anything, and round your lips a little. For the L at the end of “feel”, touch the tip behind your top teeth and lift the back of your tongue.",
    pairs: [
      ["right", "light"],
      ["road", "load"],
      ["pray", "play"],
      ["fry", "fly"],
      ["correct", "collect"],
    ],
    sentences: [
      "Read the report really carefully.",
      "The road on the right is very crowded.",
      "I feel like I'll fall asleep at school.",
    ],
  },
  {
    id: "ed-endings",
    title: "Past tense -ed endings",
    focus: "/t/ /d/ /ɪd/",
    whyEn:
      "-ed has three sounds. Hebrew speakers often say a full “ed” everywhere (“work-ed”), which sounds strange and adds a syllable.",
    whyHe:
      "לסיומת ed- יש שלושה צלילים. דוברי עברית אומרים לעיתים קרובות ״אֶד״ מלא בכל מקום (״וורק-אד״), וזה נשמע מוזר ומוסיף הברה.",
    how: "After t or d, add a syllable: wanted (WAN-tid). After voiceless sounds it's /t/: worked (workt). Otherwise /d/: called (calld).",
    pairs: [
      ["worked (workt)", "work-ed"],
      ["helped (helpt)", "help-ed"],
      ["wanted (WAN-tid)", "want"],
    ],
    sentences: [
      "I worked late and missed the bus.",
      "She called and asked if we wanted to come.",
      "We watched the game and laughed a lot.",
    ],
  },
];

export function unitById(id: string): PronunciationUnit | undefined {
  return PRONUNCIATION.find((u) => u.id === id);
}
