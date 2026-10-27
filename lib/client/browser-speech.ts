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
 * Each character's own color on top of the device voice. Phones often have one voice per
 * accent and don't say whether it's male or female, so several characters share a voice;
 * pitch and pace keep them apart.
 */
const CHARACTER_TONE: Record<string, { pitch: number; rate: number }> = {
  ava: { pitch: 0, rate: 1 },
  emma: { pitch: 0.12, rate: 1.04 },
  jenny: { pitch: -0.06, rate: 0.97 },
  sonia: { pitch: 0.05, rate: 0.98 },
  natasha: { pitch: 0.16, rate: 1.06 },
  neerja: { pitch: -0.1, rate: 1 },
  andrew: { pitch: 0, rate: 0.98 },
  brian: { pitch: 0.08, rate: 1.03 },
  guy: { pitch: -0.08, rate: 1.06 },
  ryan: { pitch: 0.04, rate: 0.97 },
  william: { pitch: -0.14, rate: 0.95 },
  prabhat: { pitch: 0.1, rate: 1 },
};

/**
 * Pitch for a character. A male character on a voice that isn't known to be male (on
 * Android the voices have no names to tell) gets a deeper pitch; a female character on a
 * male voice a higher one. Kept close to 1: device voices start to sound robotic once the
 * pitch moves much more than a fifth either way.
 */
export function pitchFor(voice: SpeechSynthesisVoice | undefined, voiceId: string): number {
  const wanted = voiceById(voiceId);
  const actual = voice ? guessGender(voice.name) : null;
  let shift = 0;
  if (wanted?.gender === "male" && actual !== "male") shift = -0.2;
  else if (wanted?.gender === "female" && actual === "male") shift = 0.18;
  const tone = (CHARACTER_TONE[voiceId]?.pitch ?? ((hash(voiceId) % 7) - 3) * 0.03) * 0.6;
  return Math.min(PITCH_MAX, Math.max(PITCH_MIN, 1 + shift + tone));
}

/** Beyond these the device voice sounds processed rather than like a person. */
export const PITCH_MIN = 0.75;
export const PITCH_MAX = 1.2;

/** The character's speaking pace relative to the chosen speed. */
export function rateFor(voiceId: string): number {
  return CHARACTER_TONE[voiceId]?.rate ?? 1;
}

/** Which of this device's voices each character speaks with (for the voice settings). */
export async function deviceVoiceNames(voiceIds: string[]): Promise<Record<string, string | null>> {
  if (!canSpeak()) return Object.fromEntries(voiceIds.map((id) => [id, null]));
  const voices = await loadVoices();
  return Object.fromEntries(voiceIds.map((id) => [id, pickVoice(voices, id)?.name ?? null]));
}

/** Speak one sentence; resolves when it ends (or fails). Cancel with stopSpeaking(). */
export async function speakInBrowser(text: string, voiceId: string, rate: number, signal?: AbortSignal): Promise<void> {
  if (!canSpeak()) throw new Error("no_speech_synthesis");
  const voice = pickVoice(await loadVoices(), voiceId);
  // Stopped while the voices were still loading: there's nothing to cancel yet, so don't start.
  if (signal?.aborted) return;
  await new Promise<void>((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    try {
      if (voice) u.voice = voice;
    } catch {
      // Some browsers reject a voice from an earlier list; the default voice still works.
    }
    u.lang = voice?.lang ?? "en-US";
    u.rate = Math.min(2, rate * rateFor(voiceId));
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

/**
 * Join a new final onto what was heard. Android Chrome often repeats the earlier words in
 * the next final ("I have", then "I have been here"), so a final that starts with
 * everything so far replaces it instead of doubling it.
 */
export function mergeFinal(prev: string, next: string): string {
  const p = prev.trim();
  const n = next.trim();
  if (!p) return n;
  if (!n) return p;
  if (n.toLowerCase().startsWith(p.toLowerCase())) return n;
  return `${p} ${n}`;
}

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
  /** The microphone actually started capturing (after permission and Chrome's beep). */
  onaudiostart?: (() => void) | null;
  onstart?: (() => void) | null;
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
