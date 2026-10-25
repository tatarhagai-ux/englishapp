/** Only plain words are sent to the voice; notes like "(workt)" or "work-ed" stay text. */
export function speakable(label: string): string | null {
  const word = label
    .replace(/\s*\(.*\)\s*/, "")
    .replace(/[↗↘]/g, "")
    .trim();
  return /^[A-Za-z' ?.,]+$/.test(word) && !/-/.test(word) ? word : null;
}
