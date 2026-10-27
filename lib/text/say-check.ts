/**
 * Checks a spoken translation against the accepted answers. Grammar is the point of the
 * drill, so a missing "a" or an extra "to" is a miss (the 0.8 threshold the "say it again"
 * screens use would let those through). Fillers and "please" don't count, and the short
 * forms that hide has/is ("She's been…") match either way.
 */
import { normalizeWords, similarity } from "./compare";

const FILLERS = new Set(["um", "uh", "er", "erm", "hmm", "please", "okay", "ok"]);
const OPENERS = new Set(["so", "well"]);
const IS_HAS_AFTER = new Set(["he", "she", "it", "that", "there", "where", "who", "what", "how", "here"]);

export function sayWords(text: string): string[] {
  const words = normalizeWords(text).filter((w) => !FILLERS.has(w));
  while (words.length > 1 && OPENERS.has(words[0])) words.shift();
  const out: string[] = [];
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (w === "can" && words[i + 1] === "not") {
      out.push("cannot");
      i++;
    } else if (w === "has" && IS_HAS_AFTER.has(out.at(-1) ?? "")) {
      out.push("is");
    } else {
      out.push(w);
    }
  }
  return out;
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
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const out: string[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length) {
    if (j < b.length && a[i] === b[j]) {
      i++;
      j++;
    } else if (j < b.length && dp[i][j + 1] >= dp[i + 1][j]) {
      j++;
    } else {
      out.push(a[i]);
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
    if (words.join(" ") === heard.join(" ")) return { status: "right", closest: answer, missing: [], extra: [] };
    const score = similarity(heard.join(" "), words.join(" "));
    if (score > best.score) best = { answer, score, words };
  }
  return {
    status: best.score >= 0.6 ? "close" : "wrong",
    closest: best.answer,
    missing: notShared(best.words, heard),
    extra: notShared(heard, best.words),
  };
}
