import { describe, expect, it } from "vitest";
import { createSpeechGate, rms } from "@/lib/client/speech-gate";
import { dropPhantom } from "@/lib/providers/stt";
import { formatFor } from "@/lib/client/server-stt";

/** Feed a level every 50 ms from `from` to `to`. */
function run(gate: ReturnType<typeof createSpeechGate>, level: number, from: number, to: number) {
  for (let t = from; t < to; t += 50) gate.feed(level, t);
}

describe("speech gate", () => {
  it("measures the room, waits for speech, and ends after the set quiet", () => {
    const gate = createSpeechGate({ silenceMs: 1000 });
    run(gate, 0.004, 0, 500);
    expect(gate.state).toBe("waiting");
    run(gate, 0.2, 500, 1500);
    expect(gate.state).toBe("speaking");
    run(gate, 0.004, 1500, 2400);
    expect(gate.state).toBe("speaking");
    run(gate, 0.004, 2400, 2700);
    expect(gate.state).toBe("done");
    expect(gate.voicedMs).toBeGreaterThan(800);
  });

  it("doesn't count a click or a cough as speech", () => {
    const gate = createSpeechGate({ silenceMs: 1000 });
    run(gate, 0.004, 0, 500);
    run(gate, 0.3, 500, 600);
    run(gate, 0.004, 600, 3000);
    expect(gate.state).toBe("waiting");
  });

  it("raises the bar in a noisy room, so the hum isn't speech but a voice is", () => {
    const gate = createSpeechGate({ silenceMs: 1000 });
    run(gate, 0.02, 0, 500);
    run(gate, 0.03, 500, 2000);
    expect(gate.state).toBe("waiting");
    run(gate, 0.2, 2000, 2500);
    expect(gate.state).toBe("speaking");
  });

  it("treats a trailing-off voice as still speaking", () => {
    const gate = createSpeechGate({ silenceMs: 1000 });
    run(gate, 0.004, 0, 500);
    run(gate, 0.2, 500, 1000);
    const bar = gate.threshold;
    run(gate, bar * 0.8, 1000, 3000);
    expect(gate.state).toBe("speaking");
  });

  it("computes loudness", () => {
    expect(rms(new Float32Array([0, 0, 0, 0]))).toBe(0);
    expect(rms(new Float32Array([0.5, -0.5, 0.5, -0.5]))).toBeCloseTo(0.5);
  });
});

describe("transcription helpers", () => {
  it("drops what Whisper makes up on silence, and keeps real short replies", () => {
    expect(dropPhantom("Thank you for watching!")).toBe("");
    expect(dropPhantom("Thanks for watching.")).toBe("");
    expect(dropPhantom("...")).toBe("");
    expect(dropPhantom("Thank you.")).toBe("Thank you.");
    expect(dropPhantom(" I've been living here for ten years. ")).toBe("I've been living here for ten years.");
  });

  it("names the recorded format the way the endpoint expects", () => {
    expect(formatFor("audio/webm;codecs=opus")).toBe("webm");
    expect(formatFor("audio/ogg;codecs=opus")).toBe("ogg");
    expect(formatFor("audio/mp4")).toBe("m4a");
  });
});
