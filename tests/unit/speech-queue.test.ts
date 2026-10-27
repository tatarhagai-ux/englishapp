import { describe, expect, it, vi } from "vitest";

// The device voice (no Azure): record the rate each sentence is read at.
const spoken: { text: string; rate: number }[] = [];
vi.mock("@/lib/client/browser-speech", () => ({
  browserSpeechActive: () => true,
  markAzureMissing: () => {},
  primeBrowserSpeech: () => {},
  stopSpeaking: () => {},
  speakInBrowser: async (text: string, _voice: string, rate: number) => {
    spoken.push({ text, rate });
  },
  canRecognize: () => false,
  createRecognition: () => null,
  mergeFinal: (a: string, b: string) => `${a} ${b}`.trim(),
}));

describe("SpeechQueue with the device voice", () => {
  it("reads a Slower replay at the slow rate, even though the voice starts after an await", async () => {
    const { SpeechQueue } = await import("@/lib/client/speech");
    let rate = 1;
    const idle = vi.fn();
    const q = new SpeechQueue({ voiceId: "ava", getRate: () => rate, onIdle: idle });
    q.speak("Say that again, slowly.", 0.75);
    rate = 1; // the caller's normal rate stays as it was
    q.speak("And this one at the normal speed.");
    await vi.waitFor(() => expect(idle).toHaveBeenCalled());
    expect(spoken).toEqual([
      { text: "Say that again, slowly.", rate: 0.75 },
      { text: "And this one at the normal speed.", rate: 1 },
    ]);
  });
});
