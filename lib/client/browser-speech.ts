"use client";

import { voiceById } from "@/content/voices";

/**
 * Free fallback when Azure isn't connected: the browser's own speech synthesis and
 * recognition (Web Speech API). Edge ships Microsoft's natural voices, Chrome uses Google's,
 * Safari uses Apple's. No pronunciation scoring here, so callers mark those results unscored.
 *
 * The app tries Azure first. The first "not configured" answer flips this switch for the
 * rest of the visit, so later clips don't wait on a request that will fail.
 */
let azureMissing = false;
export function markAzureMissing() {
  azureMissing = true;
}
export function browserSpeechActive(): boolean {
  return azureMissing;
}

// Synthesis ------------------------------------------------------------------------------

export function canSpeak(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

let voicesReady: Promise<SpeechSynthesisVoice[]> | null = null;
function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  voicesReady ??= new Promise((resolve) => {
    const now = speechSynthesis.getVoices();
    if (now.length) return resolve(now);
    // Chrome fills the list asynchronously; some browsers never fire the event.
    const done = () => resolve(speechSynthesis.getVoices());
    speechSynthesis.addEventListener("voiceschanged", done, { once: true });
    setTimeout(done, 1500);
  });
  return voicesReady;
}

/** Closest browser voice to the chosen tutor: same name if the browser has it, else same accent. */
export function pickVoice(voices: SpeechSynthesisVoice[], voiceId: string): SpeechSynthesisVoice | undefined {
  const wanted = voiceById(voiceId);
  const locale = wanted?.locale ?? "en-US";
  const english = voices.filter((v) => v.lang.replace("_", "-").startsWith("en"));
  const sameLocale = english.filter((v) => v.lang.replace("_", "-") === locale);
  const quality = (v: SpeechSynthesisVoice) =>
    (/natural|neural|online/i.test(v.name) ? 4 : 0) + (/google/i.test(v.name) ? 2 : 0) + (v.localService ? 0 : 1);
  const byQuality = (list: SpeechSynthesisVoice[]) => [...list].sort((a, b) => quality(b) - quality(a));
  if (wanted) {
    const named = english.find((v) => new RegExp(`\\b${wanted.displayName}\\b`, "i").test(v.name));
    if (named) return named;
  }
  return byQuality(sameLocale)[0] ?? byQuality(english)[0];
}

/** Speak one sentence; resolves when it ends (or fails). Cancel with stopSpeaking(). */
export async function speakInBrowser(text: string, voiceId: string, rate: number): Promise<void> {
  if (!canSpeak()) throw new Error("no_speech_synthesis");
  const voice = pickVoice(await loadVoices(), voiceId);
  await new Promise<void>((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    try {
      if (voice) u.voice = voice;
    } catch {
      // Some browsers reject a voice from an earlier list; the default voice still works.
    }
    u.lang = voice?.lang ?? "en-US";
    u.rate = rate;
    // Chrome sometimes never fires onend; don't let that freeze the conversation.
    const guard = setTimeout(resolve, 4000 + (text.length * 90) / Math.max(0.5, rate));
    const done = () => {
      clearTimeout(guard);
      resolve();
    };
    u.onend = done;
    u.onerror = done;
    speechSynthesis.speak(u);
  });
}

export function stopSpeaking() {
  if (canSpeak()) speechSynthesis.cancel();
}

/** iOS only speaks after a first utterance inside a tap. */
export function primeBrowserSpeech() {
  if (!canSpeak()) return;
  const u = new SpeechSynthesisUtterance("");
  u.volume = 0;
  speechSynthesis.speak(u);
}

// Recognition ----------------------------------------------------------------------------

interface RecognitionAlternative {
  transcript: string;
}
interface RecognitionResult {
  isFinal: boolean;
  0: RecognitionAlternative;
}
interface RecognitionEvent {
  resultIndex: number;
  results: { length: number; [i: number]: RecognitionResult };
}
export interface BrowserRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: RecognitionEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  onspeechstart?: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

function recognitionClass(): (new () => BrowserRecognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as (new () => BrowserRecognition) | null;
}

export function canRecognize(): boolean {
  return recognitionClass() !== null;
}

export function createRecognition(): BrowserRecognition | null {
  const C = recognitionClass();
  return C ? new C() : null;
}
