/**
 * Speech provider contract. Azure is the first implementation; anything else (OpenAI,
 * Groq Whisper, Google) must fit the same shape so switching is a config change.
 */

export interface SynthesizeRequest {
  text: string;
  voice: string;
  locale: string;
  /** 0.75 to 1.25, where 1 is natural speed. */
  rate?: number;
}

export interface SynthesizeResult {
  audio: ArrayBuffer;
  contentType: string;
  /** Billable characters, used by the cost meter. */
  characters: number;
}

export interface BrowserSpeechToken {
  token: string;
  region: string;
  /** Epoch ms after which the client must fetch a new token. */
  expiresAt: number;
}

export interface SpeechProvider {
  readonly name: string;
  synthesize(req: SynthesizeRequest): Promise<SynthesizeResult>;
  /** Short-lived token so the browser SDK can stream STT without seeing the real key. */
  issueBrowserToken(): Promise<BrowserSpeechToken>;
}

export { ProviderError } from "../errors";
