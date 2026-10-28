/** "1 fix", "3 fixes": the count with the word in the right form. */
export function count(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}
