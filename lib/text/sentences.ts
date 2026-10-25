/**
 * Splits a streaming LLM reply into speakable chunks, so TTS can start on the first
 * sentence while the rest is still being generated. Abbreviations and decimals must not
 * end a sentence ("Mr. Cohen", "3.5 hours", "e.g. this").
 */

const ABBREVIATIONS = new Set([
  "mr",
  "mrs",
  "ms",
  "dr",
  "prof",
  "sr",
  "jr",
  "st",
  "vs",
  "etc",
  "e.g",
  "i.e",
  "approx",
  "no",
  "u.s",
  "u.k",
]);

// Very short first chunks sound choppy, so wait for at least this many characters.
const MIN_CHUNK = 12;

function isBoundary(text: string, i: number): boolean {
  const ch = text[i];
  if (ch !== "." && ch !== "!" && ch !== "?") return false;
  const next = text[i + 1];
  // Needs whitespace (or a closing quote/paren then whitespace) after it to count.
  if (next === undefined) return false;
  if (!/\s|["')\]]/.test(next)) return false;
  if (ch === ".") {
    if (/\d/.test(text[i - 1] ?? "") && /\d/.test(next)) return false;
    const word = /([A-Za-z.]+)$/.exec(text.slice(0, i))?.[1]?.toLowerCase();
    if (word && ABBREVIATIONS.has(word)) return false;
  }
  return true;
}

export class SentenceChunker {
  private buffer = "";

  /** Feed streamed text; returns any complete sentences now ready to speak. */
  push(text: string): string[] {
    this.buffer += text;
    const out: string[] = [];
    let start = 0;
    for (let i = 0; i < this.buffer.length; i++) {
      if (!isBoundary(this.buffer, i)) continue;
      let end = i + 1;
      while (end < this.buffer.length && /["')\]]/.test(this.buffer[end])) end++;
      const piece = this.buffer.slice(start, end).trim();
      if (piece.length >= MIN_CHUNK) {
        out.push(piece);
        start = end;
      }
    }
    this.buffer = this.buffer.slice(start);
    return out;
  }

  /** Call when the stream ends to get whatever is left. */
  flush(): string[] {
    const rest = this.buffer.trim();
    this.buffer = "";
    return rest ? [rest] : [];
  }
}

export function splitSentences(text: string): string[] {
  const c = new SentenceChunker();
  return [...c.push(text), ...c.flush()];
}
