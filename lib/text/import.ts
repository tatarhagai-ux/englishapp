/** Parse pasted lists: one item per line, with or without numbering or bullets. */
export function parseImport(raw: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of raw.split(/\r?\n|;/)) {
    const item = line
      .replace(/^\s*(?:[-*•–]|\d+[.)])\s*/, "")
      .split(/\s+[-–=:]\s+/)[0]
      .trim();
    if (item.length < 2 || item.length > 120 || seen.has(item.toLowerCase())) continue;
    seen.add(item.toLowerCase());
    out.push(item);
  }
  return out;
}
