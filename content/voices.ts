/**
 * Azure neural voices offered in the app. Tutor candidates are the warm, clear voices Hagai
 * picks from on first run; the rest give roleplay characters a range of accents, which is
 * also listening practice (most apps ship a single tutor voice, a common complaint).
 */

export type Accent = "American" | "British" | "Australian" | "Indian";
export type Gender = "female" | "male";

export interface Voice {
  id: string;
  /** Azure voice name. */
  azureName: string;
  locale: string;
  displayName: string;
  gender: Gender;
  accent: Accent;
  vibe: string;
  tutorCandidate: boolean;
}

export const VOICES: readonly Voice[] = [
  {
    id: "ava",
    azureName: "en-US-AvaMultilingualNeural",
    locale: "en-US",
    displayName: "Ava",
    gender: "female",
    accent: "American",
    vibe: "Warm and expressive",
    tutorCandidate: true,
  },
  {
    id: "andrew",
    azureName: "en-US-AndrewMultilingualNeural",
    locale: "en-US",
    displayName: "Andrew",
    gender: "male",
    accent: "American",
    vibe: "Calm and confident",
    tutorCandidate: true,
  },
  {
    id: "emma",
    azureName: "en-US-EmmaMultilingualNeural",
    locale: "en-US",
    displayName: "Emma",
    gender: "female",
    accent: "American",
    vibe: "Bright and friendly",
    tutorCandidate: true,
  },
  {
    id: "brian",
    azureName: "en-US-BrianMultilingualNeural",
    locale: "en-US",
    displayName: "Brian",
    gender: "male",
    accent: "American",
    vibe: "Easygoing and casual",
    tutorCandidate: true,
  },
  {
    id: "jenny",
    azureName: "en-US-JennyNeural",
    locale: "en-US",
    displayName: "Jenny",
    gender: "female",
    accent: "American",
    vibe: "Clear and steady",
    tutorCandidate: true,
  },
  {
    id: "guy",
    azureName: "en-US-GuyNeural",
    locale: "en-US",
    displayName: "Guy",
    gender: "male",
    accent: "American",
    vibe: "Upbeat and direct",
    tutorCandidate: true,
  },
  {
    id: "sonia",
    azureName: "en-GB-SoniaNeural",
    locale: "en-GB",
    displayName: "Sonia",
    gender: "female",
    accent: "British",
    vibe: "Polished and articulate",
    tutorCandidate: true,
  },
  {
    id: "ryan",
    azureName: "en-GB-RyanNeural",
    locale: "en-GB",
    displayName: "Ryan",
    gender: "male",
    accent: "British",
    vibe: "Relaxed and witty",
    tutorCandidate: true,
  },
  {
    id: "natasha",
    azureName: "en-AU-NatashaNeural",
    locale: "en-AU",
    displayName: "Natasha",
    gender: "female",
    accent: "Australian",
    vibe: "Sunny and quick",
    tutorCandidate: false,
  },
  {
    id: "william",
    azureName: "en-AU-WilliamNeural",
    locale: "en-AU",
    displayName: "William",
    gender: "male",
    accent: "Australian",
    vibe: "Laid-back",
    tutorCandidate: false,
  },
  {
    id: "neerja",
    azureName: "en-IN-NeerjaNeural",
    locale: "en-IN",
    displayName: "Neerja",
    gender: "female",
    accent: "Indian",
    vibe: "Professional",
    tutorCandidate: false,
  },
  {
    id: "prabhat",
    azureName: "en-IN-PrabhatNeural",
    locale: "en-IN",
    displayName: "Prabhat",
    gender: "male",
    accent: "Indian",
    vibe: "Measured and kind",
    tutorCandidate: false,
  },
];

export const DEFAULT_TUTOR_VOICE_ID = "ava";

export function voiceById(id: string): Voice | undefined {
  return VOICES.find((v) => v.id === id);
}

/** A short line that shows off how a voice handles natural, slightly fast speech. */
export function sampleLine(voice: Voice): string {
  return `Hey, I'm ${voice.displayName}. I'd love to help you get more comfortable speaking English. So, how's your day going so far?`;
}
