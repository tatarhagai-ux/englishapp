import { describe, expect, it } from "vitest";
import {
  applyAnalysis,
  currentSpeakingLevel,
  initialState,
  rankedErrors,
  reviewMistake,
  reviewPhrase,
  warmupItems,
  type LearnerState,
  type SessionRecord,
} from "@/lib/learner/model";
import { analysisSchema } from "@/lib/prompts/analyzer";

/**
 * A month of practice through the real learner model: does what the app shows follow what
 * the learner actually does? Day 6 of each week is a rest day.
 */
const START = Date.UTC(2026, 9, 1, 9, 0);
const at = (d: number) => new Date(START + d * 864e5);

interface DayPlan {
  made: string[];
  right: string[];
  cefr: string;
  goodReviews: boolean;
}

function simulate(plan: (d: number) => DayPlan, days = 30) {
  let s: LearnerState = initialState(at(-1));
  const warmups: Record<string, number[]> = {};
  const levels: string[] = [];
  for (let d = 0; d < days; d++) {
    if (d % 7 === 6) continue;
    const now = at(d);
    const p = plan(d);
    for (const it of warmupItems(s, now)) {
      (warmups[it.id] ??= []).push(d);
      s =
        it.kind === "phrase" ? reviewPhrase(s, it.id, p.goodReviews, now) : reviewMistake(s, it.id, p.goodReviews, now);
    }
    const id = `s${d}`;
    const session: SessionRecord = {
      id,
      scenarioId: "free-your-week",
      mode: "voice",
      startedAt: now.toISOString(),
      endedAt: now.toISOString(),
      day: now.toISOString().slice(0, 10),
      turns: [
        { role: "tutor", text: "q" },
        { role: "learner", text: "a", input: "voice" },
      ],
      speakingSeconds: 480,
      stuckCount: 0,
      fixedAloud: [],
      xp: 0,
      costUsd: 0,
    };
    s = { ...s, sessions: [...s.sessions, session] };
    s = applyAnalysis(
      s,
      id,
      analysisSchema.parse({
        corrections: p.made.map((k) => ({ original: "x", better: "y", why_en: "z", error_key: k })),
        correct_uses: p.right,
        phrases: d === 0 ? [{ text: "the hardest part is", meaning_en: "m" }] : [],
        level: { cefr: p.cefr, confidence: "medium" },
      }),
      now,
    );
    levels.push(currentSpeakingLevel(s, "B1+"));
  }
  return { s, warmups, levels };
}

describe("a month of learning", () => {
  it("level moves with steady progress and ignores one unusual day", () => {
    const { levels } = simulate((d) => ({
      made: [],
      right: [],
      cefr: d === 3 ? "C1" : d < 10 ? "B1" : d < 20 ? "B1+" : "B2",
      goodReviews: true,
    }));
    expect(levels.slice(0, 6)).not.toContain("C1");
    expect(levels[0]).toBe("B1");
    expect(levels.at(-1)).toBe("B2");
  });

  it("a mistake fixed in conversation is mastered, and comes back if he slips", () => {
    const key = "present_perfect_duration";
    const { s } = simulate(
      (d) => ({
        made: d < 5 ? [key] : d === 20 ? [key] : [],
        right: d >= 5 && d !== 20 ? [key] : [],
        cefr: "B1+",
        goodReviews: true,
      }),
      20,
    );
    expect(s.errors[key].status).toBe("mastered");
    const relapse = simulate(
      (d) => ({
        made: d < 5 || d === 19 ? [key] : [],
        right: d >= 5 && d !== 19 ? [key] : [],
        cefr: "B1+",
        goodReviews: true,
      }),
      20,
    ).s;
    expect(relapse.errors[key].status).toBe("practicing");
  });

  it("a mistake he keeps making in speech keeps coming back in the warm-up", () => {
    const key = "missing_be";
    const { warmups, s } = simulate(() => ({ made: [key], right: [], cefr: "B1+", goodReviews: true }));
    const days = warmups[key];
    // Every conversation re-surfaces it, even though the drill answers were right.
    const gaps = days.slice(1).map((x, i) => x - days[i]);
    expect(Math.max(...gaps)).toBeLessThanOrEqual(2);
    expect(rankedErrors(s)[0].key).toBe(key);
  });

  it("a phrase he recalls well comes back less and less often", () => {
    const { warmups } = simulate(() => ({ made: [], right: [], cefr: "B1+", goodReviews: true }));
    const days = warmups["the hardest part is"];
    const gaps = days.slice(1).map((x, i) => x - days[i]);
    expect(gaps.length).toBeGreaterThanOrEqual(2);
    expect(gaps.at(-1)!).toBeGreaterThan(gaps[0]);
  });
});
