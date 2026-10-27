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
  // Spoken forms in the listening gym: typing the full form is just as right.
  gonna: "going to",
  wanna: "want to",
  gotta: "got to",
  kinda: "kind of",
  sorta: "sort of",
  lemme: "let me",
  gimme: "give me",
  outta: "out of",
  dunno: "do not know",
  "we've": "we have",
  "they've": "they have",
  "we'd": "we would",
  "you'd": "you would",
  "he'll": "he will",
  "she'll": "she will",
  "who's": "who is",
  "where's": "where is",
  "how's": "how is",
  "here's": "here is",
  "could've": "could have",
  "would've": "would have",
  "should've": "should have",
  "how've": "how have",
  "you'll": "you will",
  "we'll": "we will",
  "they'll": "they will",
  "it'll": "it will",
  "haven't": "have not",
  "hasn't": "has not",
  "wasn't": "was not",
  "couldn't": "could not",
  "wouldn't": "would not",
  "shouldn't": "should not",
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

/**
 * Did he use the phrase, alone or inside a sentence of his own? "Lately I've been…" counts
 * in "Lately I've been reading a lot". Ellipses and contractions are normalized away.
 */
export function usedPhrase(said: string, phrase: string): boolean {
  const target = normalizeWords(phrase).join(" ");
  if (!target) return false;
  return ` ${normalizeWords(said).join(" ")} `.includes(` ${target} `) || saidCorrectly(said, phrase);
}

export function wordCount(text: string): number {
  return normalizeWords(text).length;
}

const FILLER = new Set([
  "a",
  "an",
  "the",
  "at",
  "of",
  "or",
  "and",
  "to",
  "in",
  "on",
  "for",
  "their",
  "his",
  "her",
  "is",
  "are",
]);

/**
 * Does one of the analyzer's "met" items refer to this success criterion? The prompt asks
 * it to copy the wording, but models paraphrase ("Described recent activities" for
 * "Describes recent activities…"), so compare content words, allowing word endings to differ.
 */
export function criterionMet(met: string[], criterion: string): boolean {
  const stem = (w: string) => w.replace(/(ing|ed|es|s)$/, "");
  // Bracketed detail ("(I, not we)") explains the criterion; the words before it name it.
  const target = normalizeWords(criterion.replace(/\([^)]*\)/g, " "))
    .filter((w) => !FILLER.has(w))
    .map(stem);
  if (!target.length) return false;
  return met.some((m) => {
    const said = new Set(normalizeWords(m).map(stem));
    return target.filter((w) => said.has(w)).length / target.length >= 0.6;
  });
}

/**
 * The recognizer's first guess is usually right, but for a short target it often puts the
 * right words as its second or third guess ("touch bass", then "touch base"). Take a later
 * guess only when it is close to the target (0.8 or better) and better than the first, so a
 * sentence said wrongly isn't turned into the right one.
 */
export function chooseAlternative(alternatives: string[], reference: string): string {
  const first = alternatives[0] ?? "";
  let best = first;
  let bestScore = similarity(first, reference);
  for (const alt of alternatives.slice(1)) {
    const score = similarity(alt, reference);
    if (score >= 0.8 && score > bestScore) {
      best = alt;
      bestScore = score;
    }
  }
  return best;
}
