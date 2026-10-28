/**
 * Decides, from the microphone's loudness, when the learner has started talking and when
 * he's done. The first moments set the room's noise floor, so a fan or an office hum
 * doesn't count as speech. Pure: fed (level, time) pairs, so it's testable without a mic.
 */
export interface SpeechGateOptions {
  /** Quiet this long after speech means he's finished. */
  silenceMs: number;
  /** How long the noise floor is measured before speech can start. */
  calibrateMs?: number;
  /** Loud frames needed in a row before it counts as speech, not a click or a cough. */
  startMs?: number;
}

export type GateState = "calibrating" | "waiting" | "speaking" | "done";

export function createSpeechGate(opts: SpeechGateOptions) {
  const calibrateMs = opts.calibrateMs ?? 400;
  const startMs = opts.startMs ?? 150;
  let startAt: number | null = null;
  const floor: number[] = [];
  let threshold = 0.02;
  let state: GateState = "calibrating";
  let loudSince: number | null = null;
  let lastVoiceAt = 0;
  let lastAt = 0;
  let voicedMs = 0;

  function feed(level: number, now: number): GateState {
    startAt ??= now;
    const step = lastAt ? Math.min(200, now - lastAt) : 0;
    lastAt = now;
    if (state === "calibrating") {
      floor.push(level);
      if (now - startAt < calibrateMs) return state;
      const sorted = [...floor].sort((a, b) => a - b);
      // A low percentile, not the median: if he starts talking right away, his first words
      // shouldn't be taken for the room and push the bar above his own voice.
      const quiet = sorted[Math.floor(sorted.length / 5)] ?? 0;
      // Well above the room, but never so high that a soft voice is missed.
      threshold = Math.min(0.08, Math.max(0.012, quiet * 2.5));
      state = "waiting";
    }
    if (state === "done") return state;
    const loud = level >= threshold;
    if (loud) {
      voicedMs += step;
      lastVoiceAt = now;
    }
    if (state === "waiting") {
      if (loud) {
        loudSince ??= now;
        if (now - loudSince >= startMs) state = "speaking";
      } else {
        loudSince = null;
      }
      return state;
    }
    // Speaking: a softer level still counts as the voice trailing off.
    if (level >= threshold * 0.7) lastVoiceAt = now;
    if (now - lastVoiceAt >= opts.silenceMs) state = "done";
    return state;
  }

  return {
    feed,
    get state() {
      return state;
    },
    /** Total time the level was above the speech threshold. */
    get voicedMs() {
      return voicedMs;
    },
    get threshold() {
      return threshold;
    },
  };
}

/** Root-mean-square loudness of one frame of samples (-1..1). */
export function rms(samples: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i];
  return Math.sqrt(sum / Math.max(1, samples.length));
}
