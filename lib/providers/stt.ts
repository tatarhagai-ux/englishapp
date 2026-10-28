import "server-only";
import { env, NotConfiguredError } from "@/lib/env";
import { ProviderError } from "@/lib/providers/errors";

/**
 * Speech-to-text through OpenRouter's transcription endpoint, on the same key as the chat.
 * Whisper is the default: it transcribes the sound rather than rewriting it, so a learner's
 * "I bought new phone" stays that way for the report to catch. STT_MODEL can swap models.
 */
const ENDPOINT = "https://openrouter.ai/api/v1/audio/transcriptions";
export const DEFAULT_STT_MODEL = "openai/whisper-1";
const TIMEOUT_MS = 20_000;

export type AudioFormat = "webm" | "ogg" | "m4a" | "wav" | "mp3" | "aac" | "flac";

export function sttConfigured(): boolean {
  return Boolean(env.OPENROUTER_API_KEY);
}

/**
 * Whisper is known to "hear" these on near-silence or noise (it learned them from video
 * subtitles). Said on their own they're almost certainly not the learner. Short real
 * replies ("Thank you.") are left alone: the recorder only sends audio with speech in it.
 */
const PHANTOMS = [
  /^thank(s| you)( so much)? for watching[.!]?$/i,
  /^(please )?(like and )?subscribe[.!]?$/i,
  /^\.+$/,
  /^subtitles? by .*$/i,
];

export function dropPhantom(text: string): string {
  const t = text.trim();
  return PHANTOMS.some((p) => p.test(t)) ? "" : t;
}

export async function transcribe(input: {
  audioBase64: string;
  format: AudioFormat;
  /** English answers, or Hebrew when he's stuck and says it in Hebrew. */
  language?: "en" | "he";
  signal?: AbortSignal;
}): Promise<{ text: string; costUsd: number }> {
  if (!env.OPENROUTER_API_KEY) throw new NotConfiguredError("OpenRouter");
  const signal = input.signal
    ? AbortSignal.any([input.signal, AbortSignal.timeout(TIMEOUT_MS)])
    : AbortSignal.timeout(TIMEOUT_MS);
  const appUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const res = await fetch(ENDPOINT, {
    method: "POST",
    signal,
    headers: {
      Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "X-Title": "Speakwise",
      ...(appUrl ? { "HTTP-Referer": `https://${appUrl}` } : {}),
    },
    body: JSON.stringify({
      model: env.STT_MODEL ?? DEFAULT_STT_MODEL,
      input_audio: { data: input.audioBase64, format: input.format },
      language: input.language ?? "en",
      temperature: 0,
    }),
  }).catch((err: unknown) => {
    const timedOut = err instanceof DOMException && err.name === "TimeoutError";
    throw new ProviderError("openrouter", timedOut ? 504 : 502, timedOut ? "transcription timed out" : "network error");
  });
  if (!res.ok) {
    const detail = (await res.text().catch(() => "")).slice(0, 300);
    throw new ProviderError("openrouter", res.status, detail || res.statusText);
  }
  const json = (await res.json()) as { text?: string; usage?: { cost?: number } };
  return { text: dropPhantom(json.text ?? ""), costUsd: Number(json.usage?.cost ?? 0) || 0 };
}
