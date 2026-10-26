"use client";

import type * as SpeechSdk from "microsoft-cognitiveservices-speech-sdk";
import { fetchSpeech, TtsRequestError } from "./tts";
import { diffWords } from "@/lib/text/diff";
import {
  browserSpeechActive,
  createRecognition,
  mergeFinal,
  markAzureMissing,
  primeBrowserSpeech,
  speakInBrowser,
  stopSpeaking,
  type BrowserRecognition,
} from "./browser-speech";

/**
 * Browser speech layer. Recognition runs in the browser with Azure's SDK and a short-lived
 * token, so audio never passes through our server and partial captions appear while
 * Hagai is still talking. The SDK is large, so it loads only when a session starts.
 *
 * Without Azure, the same classes fall back to the browser's own speech (browser-speech.ts).
 */

type Sdk = typeof SpeechSdk;
let sdkPromise: Promise<Sdk> | null = null;
function loadSdk(): Promise<Sdk> {
  sdkPromise ??= import("microsoft-cognitiveservices-speech-sdk");
  return sdkPromise;
}

export class SpeechSetupError extends Error {
  constructor(
    public readonly kind:
      "not_configured" | "unauthorized" | "network" | "mic_denied" | "unsupported" | "no_speech" | "unknown",
  ) {
    super(kind);
  }
}

let cachedToken: { token: string; region: string; expiresAt: number } | null = null;

async function speechToken() {
  if (cachedToken && cachedToken.expiresAt - Date.now() > 30_000) return cachedToken;
  const res = await fetch("/api/speech-token", { method: "POST" }).catch(() => {
    throw new SpeechSetupError("network");
  });
  if (res.status === 503) {
    markAzureMissing();
    throw new SpeechSetupError("not_configured");
  }
  if (res.status === 401) throw new SpeechSetupError("unauthorized");
  if (!res.ok) throw new SpeechSetupError("unknown");
  cachedToken = (await res.json()) as { token: string; region: string; expiresAt: number };
  return cachedToken;
}

async function speechConfig(language: string) {
  // The token first: without Azure it fails fast, and the large SDK is never downloaded.
  const t = await speechToken();
  const sdk = await loadSdk();
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
  /**
   * Browser recognition only: it gave up after several silent rounds. Every reopening of
   * the microphone beeps on Android and flashes the status-bar icon, so it stops instead.
   */
  onIdle?: () => void;
}

/**
 * Continuous recognition with a patient end-of-speech pause (learners hesitate mid-sentence).
 * Call stop() while the tutor speaks so the recognizer never hears the tutor's voice.
 */
/**
 * Quiet time before the browser recognizer stops reopening the microphone. Chrome ends a
 * session after a few silent seconds (on Android after every pause), so this is counted in
 * time, not rounds: thinking for a while mid-answer must not end the turn.
 */
export const IDLE_AFTER_MS = 20_000;

export class Listener {
  private recognizer: SpeechSdk.SpeechRecognizer | null = null;
  private browser: BrowserRecognition | null = null;
  /** Set by stop(), even if start() is still connecting, so a late start never runs on. */
  private cancelled = false;

  constructor(
    private readonly language: string,
    private readonly silenceMs = 1200,
  ) {}

  /** Each Listener is single-use: start once, stop once. */
  async start(h: ListenHandlers): Promise<void> {
    if (browserSpeechActive()) return this.startBrowser(h);
    let config: Awaited<ReturnType<typeof speechConfig>>;
    try {
      config = await speechConfig(this.language);
    } catch (err) {
      if (err instanceof SpeechSetupError && err.kind === "not_configured") return this.startBrowser(h);
      throw err;
    }
    const { sdk, cfg } = config;
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

  /** Web Speech fallback. Chrome ends a "continuous" session after a long silence, so it restarts. */
  private startBrowser(h: ListenHandlers): void {
    if (this.cancelled) return;
    const rec = createRecognition();
    if (!rec) throw new SpeechSetupError("unsupported");
    this.browser = rec;
    rec.lang = this.language;
    rec.continuous = true;
    rec.interimResults = true;
    let segmentStart = 0;
    // Android Chrome can repeat earlier words in each new final ("I", "I have", "I have been").
    let lastFinal = "";
    let lastHeard = Date.now();
    rec.onresult = (e) => {
      if (this.cancelled) return;
      lastHeard = Date.now();
      segmentStart ||= Date.now();
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        const text = r[0].transcript.trim();
        if (!r.isFinal) interim += `${text} `;
        else if (text) {
          const seconds = Math.max(1, (Date.now() - segmentStart) / 1000);
          segmentStart = 0;
          const repeats = lastFinal && text.toLowerCase().startsWith(lastFinal.toLowerCase());
          const fresh = repeats ? text.slice(lastFinal.length).trim() : text;
          lastFinal = text;
          if (fresh) h.onFinal(fresh, seconds);
        }
      }
      if (interim.trim()) h.onPartial(interim.trim());
    };
    rec.onerror = (e) => {
      if (this.cancelled || e.error === "no-speech" || e.error === "aborted") return;
      this.cancelled = true;
      const kind = /not-allowed|service-not-allowed|audio-capture/.test(e.error) ? "mic_denied" : "network";
      h.onError(new SpeechSetupError(kind));
    };
    rec.onend = () => {
      if (this.cancelled) return;
      if (Date.now() - lastHeard > IDLE_AFTER_MS) {
        h.onIdle?.();
        return;
      }
      try {
        rec.start();
      } catch {
        // Already restarting.
      }
    };
    rec.start();
  }

  async stop(): Promise<void> {
    this.cancelled = true;
    if (this.browser) {
      this.browser.abort();
      this.browser = null;
    }
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
  /** False with the browser fallback: only the words are checked, not how they sounded. */
  scored: boolean;
}

/**
 * Browser fallback for one attempt: no sound scores, but each target word is marked heard or
 * not. A word the recognizer missed is often a sound to work on ("vest" for "west").
 */
function recognizeOnceInBrowser(
  reference: string,
  language: string,
  opts: AttemptOptions,
): Promise<PronunciationResult> {
  const rec = createRecognition();
  if (!rec) return Promise.reject(new SpeechSetupError("unsupported"));
  rec.lang = language;
  // Continuous, so a pause to think doesn't end the attempt. Android Chrome still ends the
  // session after each pause; it is reopened until the learner is really done.
  rec.continuous = true;
  rec.interimResults = true;
  const started = Date.now();
  return new Promise((resolve, reject) => {
    /** Words from earlier browser sessions of this same attempt. */
    let earlier = "";
    let current = "";
    let interim = "";
    let running = false;
    let finishing = false;
    let settled = false;
    let quietRestarts = 0;
    let silence: ReturnType<typeof setTimeout> | undefined;
    const heard = () => `${mergeFinal(earlier, current)} ${interim}`.trim();

    const settle = () => {
      if (settled) return;
      settled = true;
      clearTimeout(silence);
      clearTimeout(guard);
      const text = heard();
      if (!text) return reject(new SpeechSetupError("no_speech"));
      const { tokens, accuracy } = diffWords(text, reference);
      resolve({
        text,
        seconds: Math.max(1, (Date.now() - started) / 1000),
        pronunciation: 0,
        accuracy: Math.round(accuracy * 100),
        fluency: 0,
        completeness: 0,
        prosody: null,
        words: tokens
          .filter((t) => t.status !== "extra")
          .map((t) => ({
            word: t.word,
            accuracy: t.status === "ok" ? 100 : 0,
            error: t.status === "ok" ? "None" : "Omission",
          })),
        scored: false,
      });
    };
    // A tap on "done", a long silence after speaking, or the time limit ends it.
    const finish = () => {
      finishing = true;
      clearTimeout(silence);
      if (!running) return settle();
      try {
        rec.stop();
      } catch {
        settle();
      }
    };
    opts.signal?.addEventListener("abort", finish, { once: true });
    const guard = setTimeout(finish, MAX_ATTEMPT_MS);

    // Tell the screen once the microphone is really capturing, so the first words aren't lost.
    let announced = false;
    const listening = () => {
      if (announced) return;
      announced = true;
      opts.onListening?.();
    };
    rec.onaudiostart = listening;
    rec.onstart = listening;
    rec.onresult = (e) => {
      if (settled) return;
      let finals = "";
      interim = "";
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finals = mergeFinal(finals, r[0].transcript);
        else interim += `${r[0].transcript} `;
      }
      current = finals;
      interim = interim.trim();
      opts.onPartial?.(heard());
      // Done once he stops: sooner when the whole sentence is there, later while it isn't.
      const complete = diffWords(heard(), reference).accuracy >= 0.8;
      clearTimeout(silence);
      silence = setTimeout(finish, complete ? DONE_AFTER_MS : PAUSE_AFTER_MS);
    };
    rec.onerror = (e) => {
      if (e.error === "no-speech" || e.error === "aborted") return;
      settled = true;
      clearTimeout(silence);
      clearTimeout(guard);
      reject(
        new SpeechSetupError(/not-allowed|service-not-allowed|audio-capture/.test(e.error) ? "mic_denied" : "network"),
      );
    };
    rec.onend = () => {
      running = false;
      if (settled) return;
      // Words still on screen when it ended count too.
      earlier = mergeFinal(earlier, `${current} ${interim}`);
      current = "";
      interim = "";
      // The browser stopped on its own mid-attempt (Android does after every pause): reopen.
      // With nothing said at all, give it one more round, then stop.
      const reopen = !finishing && (Boolean(earlier) || quietRestarts++ < 1);
      if (!reopen) return settle();
      try {
        rec.start();
        running = true;
      } catch {
        settle();
      }
    };
    rec.start();
    running = true;
  });
}

/** After the whole sentence is heard, this much quiet means he's done. */
const DONE_AFTER_MS = 1500;
/** With words still missing, wait longer: he may be thinking of the next one. */
const PAUSE_AFTER_MS = 4000;

/** A single attempt never runs longer than this; most sentences take a few seconds. */
const MAX_ATTEMPT_MS = 30_000;

export interface AttemptOptions {
  /** The microphone is really open now (not just requested), so the learner can start talking. */
  onListening?: () => void;
  /** Words heard so far, while still talking. */
  onPartial?: (text: string) => void;
  /** Abort to finish the attempt now ("done"); what was heard is still scored. */
  signal?: AbortSignal;
}

/** Score one attempt at a known sentence ("Say it again"). Resolves after one utterance. */
export async function assessPronunciation(
  reference: string,
  language = "en-US",
  opts: AttemptOptions = {},
): Promise<PronunciationResult> {
  if (browserSpeechActive()) return recognizeOnceInBrowser(reference, language, opts);
  let config: Awaited<ReturnType<typeof speechConfig>>;
  try {
    config = await speechConfig(language);
  } catch (err) {
    if (err instanceof SpeechSetupError && err.kind === "not_configured")
      return recognizeOnceInBrowser(reference, language, opts);
    throw err;
  }
  const { sdk, cfg } = config;
  const pa = new sdk.PronunciationAssessmentConfig(
    reference,
    sdk.PronunciationAssessmentGradingSystem.HundredMark,
    sdk.PronunciationAssessmentGranularity.Phoneme,
    true,
  );
  pa.enableProsodyAssessment = true;
  const recognizer = new sdk.SpeechRecognizer(cfg, sdk.AudioConfig.fromDefaultMicrophoneInput());
  pa.applyTo(recognizer);
  recognizer.sessionStarted = () => opts.onListening?.();
  recognizer.recognizing = (_s, e) => opts.onPartial?.(e.result.text);
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
      scored: true,
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
  primeBrowserSpeech();
}

/**
 * Plays the tutor's reply sentence by sentence. Each sentence's audio is requested as soon
 * as it arrives, so sentence two downloads while sentence one plays.
 */
export class SpeechQueue {
  /** "browser" = speak this one with the browser's voice (no Azure). */
  private queue: { text: string; audio: Promise<Blob | "browser" | null> }[] = [];
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
    const audio: Promise<Blob | "browser" | null> = browserSpeechActive()
      ? Promise.resolve("browser")
      : fetchSpeech(clean, this.opts.voiceId, this.opts.getRate()).then(
          (blob) => {
            this.opts.onChars?.(clean.length);
            return blob;
          },
          (err) => {
            if (err instanceof TtsRequestError && err.kind === "not_configured") {
              markAzureMissing();
              return "browser" as const;
            }
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
      if (blob === "browser") {
        await speakInBrowser(next.text, this.opts.voiceId, this.opts.getRate()).catch((err) =>
          this.opts.onError?.(err),
        );
        continue;
      }
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
    stopSpeaking();
    if (this.playing) {
      this.playing = false;
      this.opts.onIdle?.();
    }
  }
}
