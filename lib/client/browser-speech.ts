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

const MALE_NAMES =
  /\b(male|david|mark|guy|andrew|brian|christopher|eric|roger|ryan|william|prabhat|steffan|james|george|daniel|thomas|alex|fred|oliver|arthur|aaron|rishi|gordon|lee|liam|mitchell|connor|ethan|jamie)\b/i;
const FEMALE_NAMES =
  /\b(female|zira|jenny|aria|ava|emma|michelle|sonia|libby|maisie|natasha|neerja|karen|samantha|susan|moira|tessa|victoria|catherine|hazel|heera|clara|olivia|nancy|jane|sara|allison)\b/i;

/** Browsers don't say a voice's gender, but the names are well known. null = can't tell. */
export function guessGender(name: string): "male" | "female" | null {
  if (MALE_NAMES.test(name)) return "male";
  if (FEMALE_NAMES.test(name)) return "female";
  return null;
}

/** A small stable number from an id, so the same character always gets the same voice. */
function hash(id: string): number {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

/**
 * Best browser voice for a character: the exact name when the browser has it (Edge ships
 * Ava and Andrew), otherwise the same gender and accent, then the same gender, then any
 * English voice. Among equals the character's id picks, so different characters get
 * different voices instead of all sharing the top one.
 */
export function pickVoice(voices: SpeechSynthesisVoice[], voiceId: string): SpeechSynthesisVoice | undefined {
  const wanted = voiceById(voiceId);
  const locale = wanted?.locale ?? "en-US";
  const english = voices.filter((v) => v.lang.replace("_", "-").startsWith("en"));
  if (wanted) {
    const named = english.find((v) => new RegExp(`\\b${wanted.displayName}\\b`, "i").test(v.name));
    if (named) return named;
  }
  const quality = (v: SpeechSynthesisVoice) =>
    (/natural|neural|online/i.test(v.name) ? 4 : 0) + (/google/i.test(v.name) ? 2 : 0) + (v.localService ? 0 : 1);
  const lang = (v: SpeechSynthesisVoice) => v.lang.replace("_", "-");
  const tiers = [
    english.filter((v) => lang(v) === locale && guessGender(v.name) === wanted?.gender),
    english.filter((v) => guessGender(v.name) === wanted?.gender),
    english.filter((v) => lang(v) === locale && guessGender(v.name) === null),
    english.filter((v) => lang(v) === locale),
    english,
  ];
  const tier = tiers.find((t) => t.length > 0);
  if (!tier) return undefined;
  // Only the better voices compete; among them the id decides.
  const best = Math.max(...tier.map(quality));
  const top = tier.filter((v) => quality(v) >= best - 2).sort((a, b) => a.name.localeCompare(b.name));
  return top[hash(voiceId) % top.length];
}

/**
 * Pitch nudge for when the browser lacks a matching voice: a male character on a female
 * voice (or the reverse) still sounds different from the tutor, and two characters on the
 * same voice don't sound identical.
 */
export function pitchFor(voice: SpeechSynthesisVoice | undefined, voiceId: string): number {
  const wanted = voiceById(voiceId);
  const actual = voice ? guessGender(voice.name) : null;
  const mismatch = wanted && actual && wanted.gender !== actual ? (wanted.gender === "male" ? -0.25 : 0.2) : 0;
  const jitter = ((hash(voiceId) % 7) - 3) * 0.03;
  return Math.min(2, Math.max(0.5, 1 + mismatch + jitter));
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
    u.pitch = pitchFor(voice, voiceId);
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
