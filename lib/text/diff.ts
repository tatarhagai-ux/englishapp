import { normalizeWords } from "./compare";

export type DiffToken = { word: string; status: "ok" | "missed" | "extra" };

/**
 * Word-level comparison for dictation: which target words he caught, which he missed, and
 * what he wrote that wasn't there. Uses the longest common subsequence of normalized words.
 */
export function diffWords(typed: string, target: string): { tokens: DiffToken[]; accuracy: number } {
  const a = normalizeWords(target);
  const b = normalizeWords(typed);
  const dp = Array.from({ length: a.length + 1 }, () => Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const tokens: DiffToken[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      tokens.push({ word: a[i], status: "ok" });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      tokens.push({ word: a[i++], status: "missed" });
    } else {
      tokens.push({ word: b[j++], status: "extra" });
    }
  }
  while (i < a.length) tokens.push({ word: a[i++], status: "missed" });
  while (j < b.length) tokens.push({ word: b[j++], status: "extra" });
  const accuracy = a.length === 0 ? 1 : dp[0][0] / Math.max(a.length, b.length);
  return { tokens, accuracy };
}
