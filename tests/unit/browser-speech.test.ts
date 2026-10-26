import { beforeEach, describe, expect, it, vi } from "vitest";

// A fake Web Speech recognizer the test can drive.
const made: FakeRecognition[] = [];
class FakeRecognition {
  lang = "";
  continuous = false;
  interimResults = false;
  starts = 0;
  aborted = false;
  onresult: ((e: unknown) => void) | null = null;
  onerror: ((e: { error: string }) => void) | null = null;
  onend: (() => void) | null = null;
  constructor() {
    made.push(this);
  }
  start() {
    this.starts++;
  }
  stop() {}
  abort() {
    this.aborted = true;
  }
  emit(results: { text: string; final: boolean }[], resultIndex = 0) {
    const list = results.map((r) => Object.assign([{ transcript: r.text }], { isFinal: r.final }));
    this.onresult?.({ resultIndex, results: list });
  }
}

beforeEach(() => {
  made.length = 0;
  vi.resetModules();
  vi.stubGlobal("window", { SpeechRecognition: FakeRecognition });
  // Azure isn't configured: the token endpoint answers 503.
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response("{}", { status: 503 })),
  );
});

function voice(name: string, lang: string, localService = true) {
  return { name, lang, localService, default: false, voiceURI: name } as SpeechSynthesisVoice;
}

describe("pickVoice", () => {
  it("uses the tutor's own voice when the browser has it (Edge)", async () => {
    const { pickVoice } = await import("@/lib/client/browser-speech");
    const voices = [
      voice("Google US English", "en-US", false),
      voice("Microsoft Ava Online (Natural) - English (United States)", "en-US", false),
    ];
    expect(pickVoice(voices, "ava")?.name).toMatch(/Ava/);
  });

  it("otherwise picks the best voice in the same accent", async () => {
    const { pickVoice } = await import("@/lib/client/browser-speech");
    const voices = [voice("Fred", "en-US"), voice("Google US English", "en-US", false), voice("Daniel", "en-GB")];
    expect(pickVoice(voices, "andrew")?.name).toBe("Google US English");
  });

  it("falls back to any English voice", async () => {
    const { pickVoice } = await import("@/lib/client/browser-speech");
    expect(pickVoice([voice("Carmit", "he-IL"), voice("Karen", "en_AU")], "ava")?.name).toBe("Karen");
  });
});

describe("Listener without Azure", () => {
  it("falls back to the browser recognizer and reports partial and final text", async () => {
    const { Listener } = await import("@/lib/client/speech");
    const onPartial = vi.fn();
    const onFinal = vi.fn();
    const listener = new Listener("en-US");
    await listener.start({ onPartial, onFinal, onError: vi.fn() });
    expect(made).toHaveLength(1);
    expect(made[0].lang).toBe("en-US");
    made[0].emit([{ text: "I have been", final: false }]);
    expect(onPartial).toHaveBeenLastCalledWith("I have been");
    made[0].emit([{ text: "I have been living here", final: true }]);
    expect(onFinal).toHaveBeenCalledWith("I have been living here", expect.any(Number));
  });

  it("restarts after the browser ends on silence, but not after stop()", async () => {
    const { Listener } = await import("@/lib/client/speech");
    const listener = new Listener("en-US");
    await listener.start({ onPartial: vi.fn(), onFinal: vi.fn(), onError: vi.fn() });
    made[0].onend?.();
    expect(made[0].starts).toBe(2);
    await listener.stop();
    expect(made[0].aborted).toBe(true);
    made[0].onend?.();
    expect(made[0].starts).toBe(2);
  });

  it("turns a blocked microphone into mic_denied", async () => {
    const { Listener } = await import("@/lib/client/speech");
    const onError = vi.fn();
    await new Listener("en-US").start({ onPartial: vi.fn(), onFinal: vi.fn(), onError });
    made[0].onerror?.({ error: "no-speech" });
    expect(onError).not.toHaveBeenCalled();
    made[0].onerror?.({ error: "not-allowed" });
    expect(onError.mock.calls[0][0].kind).toBe("mic_denied");
  });

  it("explains when the browser can't recognize speech at all", async () => {
    vi.stubGlobal("window", {});
    const { Listener } = await import("@/lib/client/speech");
    await expect(
      new Listener("en-US").start({ onPartial: vi.fn(), onFinal: vi.fn(), onError: vi.fn() }),
    ).rejects.toMatchObject({ kind: "unsupported" });
  });
});

describe("assessPronunciation without Azure", () => {
  it("marks which target words were heard, without sound scores", async () => {
    const { assessPronunciation } = await import("@/lib/client/speech");
    const pending = assessPronunciation("We went west");
    await vi.waitFor(() => expect(made).toHaveLength(1));
    made[0].emit([{ text: "we went vest", final: true }]);
    made[0].onend?.();
    const r = await pending;
    expect(r.scored).toBe(false);
    expect(r.text).toBe("we went vest");
    expect(r.words.map((w) => [w.word, w.error])).toEqual([
      ["we", "None"],
      ["went", "None"],
      ["west", "Omission"],
    ]);
  });
});
