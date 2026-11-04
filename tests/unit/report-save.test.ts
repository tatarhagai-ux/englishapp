import { describe, expect, it } from "vitest";
import { applyAnalysis, initialState, type SessionRecord } from "@/lib/learner/model";
import { parseAnalysis } from "@/lib/prompts/analyzer";

const now = new Date("2026-11-04T12:00:00Z");

function stateWithSession() {
  const s: SessionRecord = {
    id: "a",
    scenarioId: "free-your-week",
    mode: "voice",
    startedAt: now.toISOString(),
    endedAt: now.toISOString(),
    day: "2026-11-04",
    turns: [{ role: "learner", text: "I study two weeks" }],
    speakingSeconds: 290,
    stuckCount: 0,
    fixedAloud: [],
    xp: 0,
    costUsd: 0,
  };
  return { ...initialState(now), sessions: [s] };
}

describe("saving a report into the learner model", () => {
  it("a further mistake with a key we don't track yet doesn't crash (the failure seen on 4.11)", () => {
    const analysis = parseAnalysis(
      JSON.stringify({
        corrections: [
          {
            original: "I study two weeks",
            better: "I've been studying for two weeks",
            why_en: "Duration needs the present perfect.",
            error_key: "present_perfect_duration",
            severity: 3,
          },
        ],
        // Keys the model made up: not in the seed list, not in the corrections.
        other_errors: [
          { error_key: "article_missing_before_noun", original: "I have meeting", better: "I have a meeting" },
          { error_key: "wrong_preposition_in_on", original: "in Sunday", better: "on Sunday" },
        ],
        correct_uses: ["article_missing_before_noun", "something_else_new"],
      }),
    )!;
    const next = applyAnalysis(stateWithSession(), "a", analysis, now);
    expect(next.sessions[0].report?.corrections).toHaveLength(1);
    expect(next.errors.present_perfect_duration).toBeDefined();
    // Further mistakes are only counted for mistakes already being tracked.
    expect(next.errors.wrong_preposition_in_on).toBeUndefined();
  });

  it("a further mistake that is already tracked is counted once and not marked clean", () => {
    const base = stateWithSession();
    const first = applyAnalysis(
      base,
      "a",
      parseAnalysis(
        JSON.stringify({
          corrections: [{ original: "x y", better: "y x", why_en: "w", error_key: "word_order_a", severity: 2 }],
        }),
      )!,
      now,
    );
    const second = applyAnalysis(
      first,
      "a",
      parseAnalysis(
        JSON.stringify({
          other_errors: [{ error_key: "word_order_a", original: "x y", better: "y x" }],
          correct_uses: ["word_order_a"],
        }),
      )!,
      now,
    );
    expect(second.errors.word_order_a.occurrences).toBe(2);
    expect(second.errors.word_order_a.cleanSessions).toBe(0);
  });
});
