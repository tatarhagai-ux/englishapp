"use client";

import type * as SpeechSdk from "microsoft-cognitiveservices-speech-sdk";
import { fetchSpeech } from "./tts";

/**
 * Browser speech layer. Recognition runs in the browser with Azure's SDK and a short-lived
 * token, so audio never passes through our server and partial captions appear while
 * Hagai is still talking. The SDK is large, so it loads only when a session starts.
 */

type Sdk = typeof SpeechSdk;
let sdkPromise: Promise<Sdk> | null = null;
function loadSdk(): Promise<Sdk> {
  sdkPromise ??= import("microsoft-cognitiveservices-speech-sdk");
  return sdkPromise;
}

export class SpeechSetupError extends Error {
  constructor(public readonly kind: "not_configured" | "unauthorized" | "network" | "mic_denied" | "unknown") {
    super(kind);
  }
}

let cachedToken: { token: string; region: string; expiresAt: number } | null = null;

async function speechToken() {
  if (cachedToken && cachedToken.expiresAt - Date.now() > 30_000) return cachedToken;
  const res = await fetch("/api/speech-token", { method: "POST" }).catch(() => {
    throw new SpeechSetupError("network");
  });
  if (res.status === 503) throw new SpeechSetupError("not_configured");
  if (res.status === 401) throw new SpeechSetupError("unauthorized");
  if (!res.ok) throw new SpeechSetupError("unknown");
  cachedToken = (await res.json()) as { token: string; region: string; expiresAt: number };
  return cachedToken;
}

async function speechConfig(language: string) {
  const [sdk, t] = await Promise.all([loadSdk(), speechToken()]);
  const cfg = sdk.SpeechConfig.fromAuthorizationToken(t.token, t.region);
  cfg.speechRecognitionLanguage = language;
  return { sdk, cfg };
}

/** Ask for the microphone up front so a denial is caught with a clear message. */
export async function ensureMicrophone(): Promise<void> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
  } catch {
    throw new SpeechSetupError("mic_denied");
  }
}

const TICKS_PER_SECOND = 10_000_000;

export interface ListenHandlers {
  onPartial: (text: string) => void;
  /** A finished utterance. In hands-free mode this ends the learner's turn. */
  onFinal: (text: string, seconds: number) => void;
  onError: (err: SpeechSetupError) => void;
}

/**
 * Continuous recognition with a patient end-of-speech pause (learners hesitate mid-sentence).
 * Call stop() while the tutor speaks so the recognizer never hears the tutor's voice.
 */
export class Listener {
  private recognizer: SpeechSdk.SpeechRecognizer | null = null;
  /** Set by stop(), even if start() is still connecting, so a late start never runs on. */
  private cancelled = false;

  constructor(
    private readonly language: string,
    private readonly silenceMs = 1200,
  ) {}

  /** Each Listener is single-use: start once, stop once. */
  async start(h: ListenHandlers): Promise<void> {
    const { sdk, cfg } = await speechConfig(this.language);
    if (this.cancelled) return;
    cfg.setProperty(sdk.PropertyId.Speech_SegmentationSilenceTimeoutMs, String(this.silenceMs));
    // Never mask words with asterisks: the analyzer needs exactly what he said.
    cfg.setProfanity(sdk.ProfanityOption.Raw);
    const recognizer = new sdk.SpeechRecognizer(cfg, sdk.AudioConfig.fromDefaultMicrophoneInput());
    this.recognizer = recognizer;
    recognizer.recognizing = (_s, e) => {
      if (!this.cancelled) h.onPartial(e.result.text);
    };
    recognizer.recognized = (_s, e) => {
      if (this.cancelled) return;
      if (e.result.reason === sdk.ResultReason.RecognizedSpeech && e.result.text.trim()) {
        h.onFinal(e.result.text.trim(), e.result.duration / TICKS_PER_SECOND);
      }
    };
    recognizer.canceled = (_s, e) => {
      if (this.cancelled || e.reason !== sdk.CancellationReason.Error) return;
      const auth = e.errorCode === sdk.CancellationErrorCode.AuthenticationFailure;
      if (auth) cachedToken = null;
      h.onError(new SpeechSetupError(auth ? "unauthorized" : "network"));
    };
    await new Promise<void>((resolve, reject) =>
      recognizer.startContinuousRecognitionAsync(resolve, (err) =>
        reject(new SpeechSetupError(/mic|permission|NotAllowed/i.test(err) ? "mic_denied" : "unknown")),
      ),
    );
    // stop() may have been called while we were connecting.
    if (this.cancelled) await this.shutdown(recognizer);
  }

  async stop(): Promise<void> {
    this.cancelled = true;
    const r = this.recognizer;
    this.recognizer = null;
    if (r) await this.shutdown(r);
  }

  private async shutdown(r: SpeechSdk.SpeechRecognizer) {
    await new Promise<void>((resolve) => r.stopContinuousRecognitionAsync(resolve, () => resolve()));
    r.close();
  }
}

export interface WordScore {
  word: string;
  accuracy: number;
  error: string;
}

export interface PronunciationResult {
  text: string;
  seconds: number;
  pronunciation: number;
  accuracy: number;
  fluency: number;
  completeness: number;
  prosody: number | null;
  words: WordScore[];
}

/** Score one attempt at a known sentence ("Say it again"). Resolves after one utterance. */
export async function assessPronunciation(reference: string, language = "en-US"): Promise<PronunciationResult> {
  const { sdk, cfg } = await speechConfig(language);
  const pa = new sdk.PronunciationAssessmentConfig(
    reference,
    sdk.PronunciationAssessmentGradingSystem.HundredMark,
    sdk.PronunciationAssessmentGranularity.Phoneme,
    true,
  );
  pa.enableProsodyAssessment = true;
  const recognizer = new sdk.SpeechRecognizer(cfg, sdk.AudioConfig.fromDefaultMicrophoneInput());
  pa.applyTo(recognizer);
  try {
    const result = await new Promise<SpeechSdk.SpeechRecognitionResult>((resolve, reject) =>
      recognizer.recognizeOnceAsync(resolve, (err) =>
        reject(new SpeechSetupError(/mic|permission|NotAllowed/i.test(err) ? "mic_denied" : "network")),
      ),
    );
    const scores = sdk.PronunciationAssessmentResult.fromResult(result);
    const words = (scores.detailResult?.Words ?? []).map((w) => ({
      word: w.Word,
      accuracy: w.PronunciationAssessment?.AccuracyScore ?? 0,
      error: w.PronunciationAssessment?.ErrorType ?? "None",
    }));
    return {
      text: result.text ?? "",
      seconds: result.duration / TICKS_PER_SECOND,
      pronunciation: scores.pronunciationScore ?? 0,
      accuracy: scores.accuracyScore ?? 0,
      fluency: scores.fluencyScore ?? 0,
      completeness: scores.completenessScore ?? 0,
      prosody: typeof scores.prosodyScore === "number" ? scores.prosodyScore : null,
      words,
    };
  } finally {
    recognizer.close();
  }
}

// iOS Safari only lets audio play from an element that was started inside a user tap.
// primeAudio() runs in the Start tap and every later clip reuses that same element.
const SILENT_WAV = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
let sharedAudio: HTMLAudioElement | null = null;

export function primeAudio() {
  sharedAudio ??= new Audio();
  sharedAudio.src = SILENT_WAV;
  sharedAudio.play().catch(() => {});
}

/**
 * Plays the tutor's reply sentence by sentence. Each sentence's audio is requested as soon
 * as it arrives, so sentence two downloads while sentence one plays.
 */
export class SpeechQueue {
  private queue: { text: string; audio: Promise<Blob | null> }[] = [];
  private current: HTMLAudioElement | null = null;
  private playing = false;
  private generation = 0;

  constructor(
    private readonly opts: {
      voiceId: string;
      getRate: () => number;
      onStart?: () => void;
      onIdle?: () => void;
      onChars?: (chars: number) => void;
      onError?: (err: unknown) => void;
    },
  ) {}

  get busy() {
    return this.playing || this.queue.length > 0;
  }

  speak(text: string) {
    const clean = text.trim();
    if (!clean) return;
    const audio = fetchSpeech(clean, this.opts.voiceId, this.opts.getRate()).then(
      (blob) => {
        this.opts.onChars?.(clean.length);
        return blob;
      },
      (err) => {
        this.opts.onError?.(err);
        return null;
      },
    );
    this.queue.push({ text: clean, audio });
    if (!this.playing) void this.drain(this.generation);
  }

  private async drain(gen: number) {
    this.playing = true;
    this.opts.onStart?.();
    while (this.queue.length && gen === this.generation) {
      const next = this.queue.shift()!;
      const blob = await next.audio;
      if (!blob || gen !== this.generation) continue;
      const url = URL.createObjectURL(blob);
      try {
        await new Promise<void>((resolve) => {
          const el = sharedAudio ?? new Audio();
          this.current = el;
          // Never let one stuck clip freeze the conversation: give up a little after it should end.
          let guard = setTimeout(resolve, 4000 + next.text.length * 120);
          const done = () => {
            clearTimeout(guard);
            resolve();
          };
          el.onloadedmetadata = () => {
            if (Number.isFinite(el.duration)) {
              clearTimeout(guard);
              guard = setTimeout(resolve, (el.duration / Math.max(0.5, el.playbackRate)) * 1000 + 1500);
            }
          };
          el.onended = done;
          el.onerror = done;
          el.src = url;
          el.play().catch(done);
        });
      } finally {
        URL.revokeObjectURL(url);
        this.current = null;
      }
    }
    if (gen === this.generation) {
      this.playing = false;
      this.opts.onIdle?.();
    }
  }

  stop() {
    this.generation++;
    this.queue = [];
    this.current?.pause();
    this.current = null;
    if (this.playing) {
      this.playing = false;
      this.opts.onIdle?.();
    }
  }
}
