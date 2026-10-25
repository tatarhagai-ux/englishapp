/** Escape text for safe inclusion inside an SSML/XML element. */
export function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export type SpeechRate = 0.75 | 0.9 | 1 | 1.1 | 1.25;
export const SPEECH_RATES: readonly SpeechRate[] = [0.75, 0.9, 1, 1.1, 1.25];

/** 1 -> "+0%", 0.75 -> "-25%", 1.25 -> "+25%". */
export function rateToPercent(rate: number): string {
  const pct = Math.round((rate - 1) * 100);
  return `${pct >= 0 ? "+" : ""}${pct}%`;
}

export function buildSsml(opts: { text: string; voice: string; locale: string; rate?: number }): string {
  const rate = opts.rate ?? 1;
  return (
    `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${escapeXml(opts.locale)}">` +
    `<voice name="${escapeXml(opts.voice)}">` +
    `<prosody rate="${rateToPercent(rate)}">${escapeXml(opts.text)}</prosody>` +
    `</voice></speak>`
  );
}
