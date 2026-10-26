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

  it("otherwise picks the same gender and accent", async () => {
    const { pickVoice } = await import("@/lib/client/browser-speech");
    const voices = [
      voice("Microsoft Zira - English (United States)", "en-US"),
      voice("Microsoft David - English (United States)", "en-US"),
      voice("Microsoft Hazel - English (United Kingdom)", "en-GB"),
      voice("Microsoft George - English (United Kingdom)", "en-GB"),
    ];
    expect(pickVoice(voices, "andrew")?.name).toMatch(/David/);
    expect(pickVoice(voices, "ava")?.name).toMatch(/Zira/);
    expect(pickVoice(voices, "ryan")?.name).toMatch(/George/);
    expect(pickVoice(voices, "sonia")?.name).toMatch(/Hazel/);
  });

  it("gives different characters of the same kind different voices when there are several", async () => {
    const { pickVoice } = await import("@/lib/client/browser-speech");
    const voices = ["Mark", "David", "Guy", "Eric"].map((n) =>
      voice(`Microsoft ${n} Online (Natural)`, "en-US", false),
    );
    const picked = new Set(["guy", "brian", "andrew", "william", "ryan"].map((id) => pickVoice(voices, id)?.name));
    expect(picked.size).toBeGreaterThan(1);
    // Stable: the same character always gets the same voice.
    expect(pickVoice(voices, "brian")?.name).toBe(pickVoice(voices, "brian")?.name);
  });

  it("guesses gender from well-known names and pitches a mismatch apart", async () => {
    const { guessGender, pitchFor, pickVoice } = await import("@/lib/client/browser-speech");
    expect(guessGender("Microsoft Guy Online (Natural)")).toBe("male");
    expect(guessGender("Samantha")).toBe("female");
    expect(guessGender("Google US English")).toBeNull();
    const onlyFemale = [voice("Microsoft Zira - English (United States)", "en-US")];
    const v = pickVoice(onlyFemale, "andrew");
    expect(pitchFor(v, "andrew")).toBeLessThan(pitchFor(v, "ava"));
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

  it("drops words Android Chrome repeats from the previous final", async () => {
    const { Listener } = await import("@/lib/client/speech");
    const onFinal = vi.fn();
    await new Listener("en-US").start({ onPartial: vi.fn(), onFinal, onError: vi.fn() });
    made[0].emit([{ text: "I have been", final: true }]);
    made[0].emit([{ text: "I have been living here", final: true }]);
    made[0].emit([{ text: "for two years", final: true }]);
    expect(onFinal.mock.calls.map((c) => c[0])).toEqual(["I have been", "living here", "for two years"]);
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

  it("keeps reopening through a thinking pause, and stops after a long quiet, and says so", async () => {
    vi.useFakeTimers();
    try {
      const { Listener, IDLE_AFTER_MS } = await import("@/lib/client/speech");
      const onIdle = vi.fn();
      await new Listener("en-US").start({ onPartial: vi.fn(), onFinal: vi.fn(), onError: vi.fn(), onIdle });
      // Android ends a session every few seconds of quiet: short rounds keep reopening.
      for (let i = 0; i < 5; i++) {
        vi.advanceTimersByTime(3000);
        made[0].onend?.();
      }
      expect(made[0].starts).toBe(6);
      expect(onIdle).not.toHaveBeenCalled();
      vi.advanceTimersByTime(IDLE_AFTER_MS);
      made[0].onend?.();
      expect(made[0].starts).toBe(6);
      expect(onIdle).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("counts a heard word as activity, so talking keeps the microphone open", async () => {
    vi.useFakeTimers();
    try {
      const { Listener, IDLE_AFTER_MS } = await import("@/lib/client/speech");
      const onIdle = vi.fn();
      await new Listener("en-US").start({ onPartial: vi.fn(), onFinal: vi.fn(), onError: vi.fn(), onIdle });
      for (let i = 0; i < 6; i++) {
        vi.advanceTimersByTime(IDLE_AFTER_MS / 2);
        made[0].emit([{ text: `word ${i}`, final: true }]);
        made[0].onend?.();
      }
      expect(onIdle).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
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
  /** "Done": the browser's stop() ends the session, as it does for real. */
  const stopEnds = (rec: FakeRecognition) => vi.spyOn(rec, "stop").mockImplementation(() => rec.onend?.());

  it("marks which target words were heard, without sound scores", async () => {
    const { assessPronunciation } = await import("@/lib/client/speech");
    const ctrl = new AbortController();
    const pending = assessPronunciation("We went west", "en-US", { signal: ctrl.signal });
    await vi.waitFor(() => expect(made).toHaveLength(1));
    stopEnds(made[0]);
    made[0].emit([{ text: "we went vest", final: true }]);
    ctrl.abort();
    const r = await pending;
    expect(r.scored).toBe(false);
    expect(r.text).toBe("we went vest");
    expect(r.words.map((w) => [w.word, w.error])).toEqual([
      ["we", "None"],
      ["went", "None"],
      ["west", "Omission"],
    ]);
  });

  it("listens continuously and reopens when Android ends the session at a pause", async () => {
    const { assessPronunciation } = await import("@/lib/client/speech");
    const ctrl = new AbortController();
    const onPartial = vi.fn();
    const pending = assessPronunciation("I have been living here for two years", "en-US", {
      signal: ctrl.signal,
      onPartial,
    });
    await vi.waitFor(() => expect(made).toHaveLength(1));
    expect(made[0].continuous).toBe(true);
    stopEnds(made[0]);
    made[0].emit([{ text: "I have been", final: true }]);
    made[0].onend?.();
    expect(made[0].starts).toBe(2);
    // Android repeats the earlier words in the next final; they aren't doubled.
    made[0].emit([
      { text: "living here", final: true },
      { text: "for two", final: false },
    ]);
    expect(onPartial).toHaveBeenLastCalledWith("I have been living here for two");
    ctrl.abort();
    expect((await pending).text).toBe("I have been living here for two");
  });

  it("finishes by itself after a short quiet once the sentence is all there", async () => {
    const { assessPronunciation } = await import("@/lib/client/speech");
    const pending = assessPronunciation("We went west");
    await vi.waitFor(() => expect(made).toHaveLength(1));
    vi.useFakeTimers();
    try {
      stopEnds(made[0]);
      made[0].emit([{ text: "we went", final: true }]);
      vi.advanceTimersByTime(2000);
      // Still missing a word: it keeps waiting.
      expect(made[0].stop).not.toHaveBeenCalled();
      made[0].emit([{ text: "we went west", final: true }]);
      vi.advanceTimersByTime(1600);
      expect(made[0].stop).toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
    expect((await pending).text).toBe("we went west");
  });

  it("says when the microphone is really open, shows words as they come, and stops on request", async () => {
    const { assessPronunciation } = await import("@/lib/client/speech");
    const onListening = vi.fn();
    const onPartial = vi.fn();
    const ctrl = new AbortController();
    const pending = assessPronunciation("I have been here", "en-US", { onListening, onPartial, signal: ctrl.signal });
    await vi.waitFor(() => expect(made).toHaveLength(1));
    const rec = made[0] as unknown as { onaudiostart?: () => void };
    expect(onListening).not.toHaveBeenCalled();
    rec.onaudiostart?.();
    expect(onListening).toHaveBeenCalledTimes(1);
    made[0].emit([{ text: "I have been", final: false }]);
    expect(onPartial).toHaveBeenLastCalledWith("I have been");
    // "Done" while words are still interim: they still count.
    const stop = stopEnds(made[0]);
    ctrl.abort();
    expect(stop).toHaveBeenCalled();
    expect((await pending).text).toBe("I have been");
  });

  it("reports silence as no_speech after one more try, instead of a sentence of missed words", async () => {
    const { assessPronunciation } = await import("@/lib/client/speech");
    const pending = assessPronunciation("We went west");
    await vi.waitFor(() => expect(made).toHaveLength(1));
    made[0].onerror?.({ error: "no-speech" });
    made[0].onend?.();
    expect(made[0].starts).toBe(2);
    made[0].onend?.();
    await expect(pending).rejects.toMatchObject({ kind: "no_speech" });
  });
});

describe("browser voices for characters", () => {
  it("gives a male character a deeper pitch on a voice of unknown gender (Android)", async () => {
    const { pickVoice, pitchFor } = await import("@/lib/client/browser-speech");
    const android = [voice("English United States", "en-US"), voice("English United Kingdom", "en-GB")];
    const male = pitchFor(pickVoice(android, "andrew"), "andrew");
    const female = pitchFor(pickVoice(android, "ava"), "ava");
    expect(male).toBeLessThanOrEqual(0.82);
    expect(female).toBeGreaterThanOrEqual(1);
  });

  it("keeps characters on the same device voice apart by pitch and pace", async () => {
    const { pickVoice, pitchFor, rateFor } = await import("@/lib/client/browser-speech");
    const { VOICES } = await import("@/content/voices");
    const one = [voice("English United States", "en-US")];
    const tones = VOICES.map((v) => `${pitchFor(pickVoice(one, v.id), v.id).toFixed(2)}/${rateFor(v.id)}`);
    expect(new Set(tones).size).toBe(VOICES.length);
  });
});

describe("pitchFor", () => {
  it("keeps every character within the range that still sounds natural", async () => {
    const { pitchFor, PITCH_MIN, PITCH_MAX } = await import("@/lib/client/browser-speech");
    const { VOICES } = await import("@/content/voices");
    const unnamed = voice("English United States", "en-US");
    for (const v of VOICES) {
      const p = pitchFor(unnamed, v.id);
      expect(p).toBeGreaterThanOrEqual(PITCH_MIN);
      expect(p).toBeLessThanOrEqual(PITCH_MAX);
    }
  });
});
