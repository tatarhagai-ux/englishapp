import { beforeEach, describe, expect, it, vi } from "vitest";

// A fake Azure SDK that records recognizers and lets the test fire recognition events.
const created: FakeRecognizer[] = [];
class FakeRecognizer {
  started = false;
  stopped = false;
  closed = false;
  recognizing?: (s: unknown, e: unknown) => void;
  recognized?: (s: unknown, e: { result: { reason: number; text: string; duration: number } }) => void;
  canceled?: (s: unknown, e: unknown) => void;
  constructor() {
    created.push(this);
  }
  startContinuousRecognitionAsync(ok: () => void) {
    this.started = true;
    setTimeout(ok, 5);
  }
  stopContinuousRecognitionAsync(ok: () => void) {
    this.stopped = true;
    ok();
  }
  close() {
    this.closed = true;
  }
}

vi.mock("microsoft-cognitiveservices-speech-sdk", () => ({
  SpeechConfig: {
    fromAuthorizationToken: () => ({ setProperty() {}, setProfanity() {}, speechRecognitionLanguage: "" }),
  },
  AudioConfig: { fromDefaultMicrophoneInput: () => ({}) },
  SpeechRecognizer: FakeRecognizer,
  PropertyId: { Speech_SegmentationSilenceTimeoutMs: 31 },
  ProfanityOption: { Raw: 2 },
  ResultReason: { RecognizedSpeech: 3 },
  CancellationReason: { Error: 1 },
  CancellationErrorCode: { AuthenticationFailure: 1 },
}));

beforeEach(() => {
  created.length = 0;
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () => new Response(JSON.stringify({ token: "t", region: "westeurope", expiresAt: Date.now() + 600_000 })),
    ),
  );
});

describe("Listener", () => {
  it("delivers final results and stops cleanly", async () => {
    const { Listener } = await import("@/lib/client/speech");
    const finals: string[] = [];
    const l = new Listener("en-US");
    await l.start({ onPartial: () => {}, onFinal: (t) => finals.push(t), onError: () => {} });
    created[0].recognized!(null, { result: { reason: 3, text: " Hello there ", duration: 20_000_000 } });
    expect(finals).toEqual(["Hello there"]);
    await l.stop();
    expect(created[0]).toMatchObject({ stopped: true, closed: true });
    created[0].recognized!(null, { result: { reason: 3, text: "late", duration: 1 } });
    expect(finals).toEqual(["Hello there"]);
  });

  it("a stop() during start() never leaves a recognizer running", async () => {
    const { Listener } = await import("@/lib/client/speech");
    const l = new Listener("en-US");
    const starting = l.start({ onPartial: () => {}, onFinal: () => {}, onError: () => {} });
    await l.stop(); // before the token fetch even resolved
    await starting;
    expect(created.every((r) => !r.started || (r.stopped && r.closed))).toBe(true);
  });

  it("a stop() while connecting shuts the recognizer once it is up", async () => {
    const { Listener } = await import("@/lib/client/speech");
    const l = new Listener("en-US");
    const starting = l.start({ onPartial: () => {}, onFinal: () => {}, onError: () => {} });
    await vi.waitFor(() => expect(created.length).toBe(1));
    await l.stop();
    await starting;
    expect(created[0]).toMatchObject({ started: true, stopped: true, closed: true });
  });
});
