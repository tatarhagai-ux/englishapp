"use client";

import { createSpeechGate, rms } from "./speech-gate";

/**
 * Accurate recognition: record the answer, then have a speech model (Whisper, through
 * /api/transcribe) write it down. Far better with an accent than the browser's recognizer,
 * at the cost of a second or two after he stops. Android can't give the microphone to the
 * browser's recognizer and a recorder at once, so this replaces it rather than running
 * alongside.
 */

export class SttError extends Error {
  constructor(public readonly kind: "mic_denied" | "no_speech" | "unavailable" | "network" | "unauthorized") {
    super(kind);
  }
}

let available: boolean | null = null;
let probe: Promise<boolean> | null = null;

/**
 * Whether the server can transcribe (no audio sent). A clear answer is kept for the visit;
 * a network blip or a not-yet-unlocked app is asked again next time.
 */
export function serverSttReady(): Promise<boolean> {
  if (available !== null) return Promise.resolve(available);
  probe ??= fetch("/api/transcribe")
    .then(async (r) => {
      if (!r.ok) return false;
      const j = (await r.json()) as { available?: boolean };
      available = Boolean(j.available);
      return available;
    })
    .catch(() => false)
    .finally(() => {
      probe = null;
    });
  return probe;
}

/** After a failure that a retry won't fix (no key, no credit), use the browser for the rest of the visit. */
function markUnavailable() {
  available = false;
}

export function canRecordAudio(): boolean {
  return (
    typeof window !== "undefined" &&
    "MediaRecorder" in window &&
    !!navigator.mediaDevices?.getUserMedia &&
    !!(window.AudioContext ?? (window as unknown as { webkitAudioContext?: unknown }).webkitAudioContext)
  );
}

const MIME_TYPES = ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/mp4", "audio/webm"];

export function formatFor(mime: string): "webm" | "ogg" | "m4a" {
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("mp4") || mime.includes("aac")) return "m4a";
  return "webm";
}

export interface RecordOptions {
  /** Abort = "I'm done": what was said so far is kept. */
  signal?: AbortSignal;
  /** Quiet this long after speech ends the recording. */
  silenceMs: number;
  /** Hard limit for one answer. */
  maxMs: number;
  /** With no speech at all for this long, give up. */
  noSpeechMs?: number;
  /** The microphone is really recording now. */
  onListening?: () => void;
}

export interface Recording {
  blob: Blob;
  mime: string;
  seconds: number;
}

/** Record one answer: from the first word until he goes quiet (or taps done). */
export async function recordUtterance(opts: RecordOptions): Promise<Recording> {
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
    });
  } catch {
    throw new SttError("mic_denied");
  }
  // Tapped "done" (or left) while the permission prompt was still open: nothing was said.
  if (opts.signal?.aborted) {
    stream.getTracks().forEach((t) => t.stop());
    throw new SttError("no_speech");
  }
  const mime = MIME_TYPES.find((t) => MediaRecorder.isTypeSupported?.(t)) ?? "";
  const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
  const Ctx =
    window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctx();
  // Some browsers start it suspended; a suspended analyser reads silence forever.
  if (ctx.state === "suspended") void ctx.resume().catch(() => {});
  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 1024;
  source.connect(analyser);
  const frame = new Float32Array(analyser.fftSize);
  const gate = createSpeechGate({ silenceMs: opts.silenceMs });
  const chunks: Blob[] = [];
  const started = Date.now();

  return new Promise<Recording>((resolve, reject) => {
    let ended = false;
    const cleanup = () => {
      clearInterval(tick);
      opts.signal?.removeEventListener("abort", end);
      stream.getTracks().forEach((t) => t.stop());
      void ctx.close().catch(() => {});
    };
    const end = () => {
      if (ended) return;
      ended = true;
      if (recorder.state !== "inactive") recorder.stop();
      else finish();
    };
    const finish = () => {
      cleanup();
      // A tap on "done" before any word, or only noise: nothing worth sending.
      if (gate.state !== "speaking" && gate.state !== "done") return reject(new SttError("no_speech"));
      const blob = new Blob(chunks, { type: recorder.mimeType || mime || "audio/webm" });
      if (!blob.size) return reject(new SttError("no_speech"));
      resolve({ blob, mime: blob.type, seconds: Math.max(1, (Date.now() - started) / 1000) });
    };
    recorder.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data);
    };
    recorder.onstop = finish;
    recorder.onstart = () => opts.onListening?.();
    const tick = setInterval(() => {
      analyser.getFloatTimeDomainData(frame);
      const now = Date.now();
      const state = gate.feed(rms(frame), now);
      const elapsed = now - started;
      if (state === "done" || elapsed >= opts.maxMs) end();
      else if (state !== "speaking" && elapsed >= (opts.noSpeechMs ?? 10_000)) end();
    }, 50);
    opts.signal?.addEventListener("abort", end, { once: true });
    try {
      recorder.start(250);
    } catch {
      cleanup();
      reject(new SttError("mic_denied"));
    }
  });
}

async function toBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

/** Send one recording to be written down. Returns the words and what it cost. */
export async function transcribeRecording(
  rec: Recording,
  language: "en" | "he" = "en",
): Promise<{ text: string; costUsd: number }> {
  const res = await fetch("/api/transcribe", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ audio: await toBase64(rec.blob), format: formatFor(rec.mime), language }),
  }).catch(() => {
    throw new SttError("network");
  });
  if (res.status === 401) throw new SttError("unauthorized");
  if (res.status === 503 || res.status === 402) {
    markUnavailable();
    throw new SttError("unavailable");
  }
  if (!res.ok) {
    const code = await res
      .json()
      .then((b: { error?: string }) => b.error)
      .catch(() => undefined);
    if (code === "provider_auth") markUnavailable();
    throw new SttError(code === "provider_auth" ? "unavailable" : "network");
  }
  const json = (await res.json()) as { text?: string; costUsd?: number };
  return { text: (json.text ?? "").trim(), costUsd: Number(json.costUsd) || 0 };
}
