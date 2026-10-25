/**
 * Did he say the target sentence? Speech recognition drops punctuation, changes case and
 * may expand or contract ("I've" vs "I have"), so compare normalized words and allow a
 * small edit distance instead of demanding an exact match.
 */

const CONTRACTIONS: Record<string, string> = {
  "i'm": "i am",
  "i've": "i have",
  "i'd": "i would",
  "i'll": "i will",
  "you're": "you are",
  "you've": "you have",
  "it's": "it is",
  "that's": "that is",
  "there's": "there is",
  "we're": "we are",
  "they're": "they are",
  "he's": "he is",
  "she's": "she is",
  "don't": "do not",
  "doesn't": "does not",
  "didn't": "did not",
  "can't": "cannot",
  "won't": "will not",
  "isn't": "is not",
  "aren't": "are not",
  "what's": "what is",
  "let's": "let us",
};

export function normalizeWords(text: string): string[] {
  const lowered = text.toLowerCase().replace(/[’‘]/g, "'");
  const expanded = lowered
    .split(/\s+/)
    .map((w) => w.replace(/^[^a-z0-9']+|[^a-z0-9']+$/g, ""))
    .flatMap((w) => (CONTRACTIONS[w] ?? w).split(" "));
  return expanded.map((w) => w.replace(/'/g, "")).filter(Boolean);
}

function editDistance(a: string[], b: string[]): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return dp[a.length][b.length];
}

/** 1 = identical words, 0 = nothing in common. */
export function similarity(said: string, target: string): number {
  const a = normalizeWords(said);
  const b = normalizeWords(target);
  if (a.length === 0 && b.length === 0) return 1;
  return 1 - editDistance(a, b) / Math.max(a.length, b.length);
}

export function saidCorrectly(said: string, target: string, threshold = 0.8): boolean {
  return similarity(said, target) >= threshold;
}

export function wordCount(text: string): number {
  return normalizeWords(text).length;
}
