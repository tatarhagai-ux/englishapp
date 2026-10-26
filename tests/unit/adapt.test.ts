import { describe, expect, it } from "vitest";
import { analysisSchema } from "@/lib/prompts/analyzer";
import { initialState, type LearnerState, type SessionRecord } from "@/lib/learner/model";
import { adaptation, latestFeeling, learningTip, paceFor } from "@/lib/learner/adapt";
import { mergeStates } from "@/lib/learner/merge";
import { buildTutorSystemPrompt } from "@/lib/prompts/tutor";
import { scenarioById } from "@/content/scenarios";

const TODAY = "2026-10-28"; // a Wednesday; the week started Sunday 2026-10-25

let n = 0;
function convo(
  answers: string[],
  extra: Partial<SessionRecord> = {},
  corrections = 3,
  day = "2026-10-26",
): SessionRecord {
  return {
    id: `s${n++}`,
    scenarioId: "free-your-week",
    mode: "voice",
    startedAt: `${day}T15:00:00Z`,
    endedAt: `${day}T15:10:00Z`,
    day,
    turns: [
      { role: "tutor", text: "Hi! How was your week?" },
      ...answers.map((text) => ({ role: "learner" as const, text, input: "voice" as const })),
    ],
    speakingSeconds: 300,
    stuckCount: 0,
    fixedAloud: [],
    xp: 0,
    costUsd: 0,
    report: analysisSchema.parse({
      corrections: Array.from({ length: corrections }, (_, i) => ({
        original: `a${i}`,
        better: `b${i}`,
        why_en: "x",
        why_he: "x",
        error_key: "present-perfect-duration",
        severity: 2,
      })),
    }),
    ...extra,
  };
}

const state = (...sessions: SessionRecord[]): LearnerState => ({ ...initialState(), sessions });
const medium = ["I went to the gym and studied a bit"];
const long = ["I've been studying for the AZ-900 exam every evening, and honestly it's going better than I expected"];

describe("how the tutor adapts", () => {
  it("stays steady until there is enough to go on", () => {
    expect(adaptation(state(), TODAY).level).toBe("steady");
    expect(adaptation(state(convo(medium, { stuckCount: 3 })), TODAY).level).toBe("steady");
  });

  it("goes easier when he got stuck a lot or kept asking to hear it again", () => {
    const stuck = adaptation(state(convo(medium, { stuckCount: 1 }), convo(medium, { stuckCount: 1 })), TODAY);
    expect(stuck.level).toBe("easier");
    expect(stuck.reasons.join()).toMatch(/stuck/);
    const lost = adaptation(
      state(convo(medium, { help: { replay: 1 } }), convo(medium, { help: { simplify: 1 } })),
      TODAY,
    );
    expect(lost.level).toBe("easier");
  });

  it("stretches him when answers are long and smooth", () => {
    expect(adaptation(state(convo(long), convo(long)), TODAY).level).toBe("stretch");
  });

  it("listens to how the week felt, this week or last", () => {
    const s = { ...state(convo(medium), convo(medium)), feelings: { "2026-10-18": "hard" as const } };
    expect(latestFeeling(s, TODAY)).toBe("hard");
    expect(adaptation(s, TODAY)).toMatchObject({ level: "easier", reasons: ["you said the week felt hard"] });
    // A newer answer replaces it; one from two weeks ago no longer counts.
    expect(adaptation({ ...s, feelings: { "2026-10-25": "easy" } }, TODAY).level).toBe("stretch");
    expect(latestFeeling({ ...s, feelings: { "2026-10-11": "hard" } }, TODAY)).toBeUndefined();
  });

  it("slows the voice a little only on the easier level", () => {
    expect(paceFor("easier")).toBeLessThan(1);
    expect(paceFor("steady")).toBe(1);
  });

  it("keeps the weekly answers when syncing", () => {
    const a = { ...initialState(), feelings: { "2026-10-18": "hard" as const } };
    const b = { ...initialState(), feelings: { "2026-10-25": "right" as const } };
    expect(mergeStates(a, b).feelings).toEqual({ "2026-10-18": "hard", "2026-10-25": "right" });
  });
});

describe("one learning tip", () => {
  it("needs a couple of conversations first", () => {
    expect(learningTip(state(convo(medium)))).toBeNull();
  });

  it("suggests longer answers when they are short", () => {
    expect(learningTip(state(convo(["Yes", "I think so"]), convo(["Good"])))?.title).toBe("Add one more sentence");
  });

  it("points to the fixes when they are rarely said out loud", () => {
    expect(learningTip(state(convo(medium), convo(medium)))?.title).toBe("Say the fixes out loud");
  });

  it("puts getting stuck first, and has something kind when all is well", () => {
    expect(learningTip(state(convo(["Yes"], { stuckCount: 2 }), convo(["Ok"])))?.title).toBe(
      "Getting stuck is part of it",
    );
    const fine = state(convo(medium, { fixedAloud: ["a", "b"] }), convo(medium, { fixedAloud: ["c"] }));
    expect(learningTip(fine)?.title).toBe("Keep the rhythm");
  });
});

describe("tutor prompt", () => {
  const base = {
    scenario: scenarioById("free-your-week")!,
    tutorName: "Ava",
    correctionMode: "gentle" as const,
    targetKeys: [],
    wrapUp: false,
  };
  it("pitches the English to his level and is always patient", () => {
    expect(buildTutorSystemPrompt({ ...base, level: "easier" })).toMatch(/simple English \(around B1\)/);
    expect(buildTutorSystemPrompt({ ...base, level: "stretch" })).toMatch(/stretch him/);
    const steady = buildTutorSystemPrompt(base);
    expect(steady).toMatch(/B2-level/);
    expect(steady).toMatch(/offer just that word/);
  });
});
