export interface EvalItem {
  id: string;
  question: string;
  text: string;
  errors: string[];
}

/** A spread of sentences: some with mistakes, some already natural. */
export function pickItems(all: EvalItem[], n: number): EvalItem[] {
  const bad = all.filter((i) => i.errors.length > 0);
  const good = all.filter((i) => i.errors.length === 0);
  const nGood = Math.min(good.length, Math.round(n / 3));
  return [...bad.slice(0, n - nGood), ...good.slice(0, nGood)];
}
