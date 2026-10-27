/**
 * Checks a spoken translation against the accepted answers. Grammar is the point of the
 * drill, so a missing "a" or an extra "to" is a miss (the 0.8 threshold the "say it again"
 * screens use would let those through). Fillers and "please" don't count, digits match
 * their words, and only the short form that really is ambiguous ("she's" = she is / she
 * has) matches either; a full "is" never stands in for "has".
 */
import { normalizeWords } from "./compare";

const FILLERS = new Set(["um", "uh", "er", "erm", "hmm", "please", "okay", "ok"]);
const OPENERS = new Set(["so", "well"]);
/** Stands for "'s" after a pronoun: is or has. */
const IS_OR_HAS = "'s";
const AMBIGUOUS_S = /\b(he|she|it|that|there|where|who|what|how|here)['’]s\b/gi;
const NUMBERS: Record<string, string> = {
  "1": "one",
  "2": "two",
  "3": "three",
  "4": "four",
  "5": "five",
  "6": "six",
  "7": "seven",
  "8": "eight",
  "9": "nine",
  "10": "ten",
  "12": "twelve",
  "15": "fifteen",
  "20": "twenty",
  "25": "twenty five",
  "30": "thirty",
};

export function sayWords(text: string): string[] {
  // Keep the ambiguous "'s" as its own marker before contractions are expanded.
  const marked = text.replace(AMBIGUOUS_S, "$1 SISORHAS");
  const words = normalizeWords(marked)
    .map((w) => (w === "sisorhas" ? IS_OR_HAS : w))
    .flatMap((w) => (NUMBERS[w] ?? w).split(" "))
    .filter((w) => !FILLERS.has(w));
  while (words.length > 1 && OPENERS.has(words[0])) words.shift();
  const out: string[] = [];
  for (let i = 0; i < words.length; i++) {
    if (words[i] === "can" && words[i + 1] === "not") {
      out.push("cannot");
      i++;
    } else {
      out.push(words[i]);
    }
  }
  return out;
}

function same(a: string, b: string): boolean {
  if (a === b) return true;
  if (a === IS_OR_HAS) return b === "is" || b === "has";
  if (b === IS_OR_HAS) return a === "is" || a === "has";
  return false;
}

function editDistance(a: string[], b: string[]): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (same(a[i - 1], b[j - 1]) ? 0 : 1));
    }
  }
  return dp[a.length][b.length];
}

export interface SayCheck {
  status: "right" | "close" | "wrong";
  /** The accepted answer closest to what he said. */
  closest: string;
  /** Words of that answer he left out, and words he added. */
  missing: string[];
  extra: string[];
}

/** Words of a not in the longest common subsequence with b. */
function notShared(a: string[], b: string[]): string[] {
  const dp = Array.from({ length: a.length + 1 }, () => Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      dp[i][j] = same(a[i], b[j]) ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const out: string[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length) {
    if (j < b.length && same(a[i], b[j])) {
      i++;
      j++;
    } else if (j < b.length && dp[i][j + 1] >= dp[i + 1][j]) {
      j++;
    } else {
      out.push(a[i] === IS_OR_HAS ? "is/has" : a[i]);
      i++;
    }
  }
  return out;
}

export function checkSay(said: string, answers: string[]): SayCheck {
  const heard = sayWords(said);
  let best = { answer: answers[0], score: -1, words: sayWords(answers[0]) };
  for (const answer of answers) {
    const words = sayWords(answer);
    const distance = editDistance(heard, words);
    if (distance === 0) return { status: "right", closest: answer, missing: [], extra: [] };
    const score = 1 - distance / Math.max(heard.length, words.length, 1);
    if (score > best.score) best = { answer, score, words };
  }
  return {
    status: best.score >= 0.6 ? "close" : "wrong",
    closest: best.answer,
    missing: notShared(best.words, heard),
    extra: notShared(heard, best.words),
  };
}
