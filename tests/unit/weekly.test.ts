import { describe, expect, it } from "vitest";
import { PLAN_DAYS } from "@/content/plan";
import { PLACEMENT_ID, SCENARIOS, scenarioById, scenarioLevel } from "@/content/scenarios";
import { computeStreak } from "@/lib/game/streak";
import { analysisSchema } from "@/lib/prompts/analyzer";
import { initialState, type SessionRecord } from "@/lib/learner/model";
import { speakingChecks, weeklySummary, weekStart } from "@/lib/learner/weekly";

function session(day: string, extra: Partial<SessionRecord> = {}): SessionRecord {
  return {
    id: `s-${day}-${extra.scenarioId ?? "free"}-${extra.planDay ?? ""}`,
    scenarioId: "free-your-week",
    mode: "voice",
    startedAt: `${day}T15:00:00Z`,
    endedAt: `${day}T15:10:00Z`,
    day,
    turns: [{ role: "learner", text: "I went to the gym", input: "voice" }],
    speakingSeconds: 300,
    stuckCount: 0,
    fixedAloud: [],
    xp: 0,
    costUsd: 0,
    report: analysisSchema.parse({}),
    ...extra,
  };
}

describe("streak with rest days", () => {
  const today = "2026-10-26";
  it("keeps the streak over up to two missed days in a row", () => {
    expect(computeStreak(["2026-10-21", "2026-10-22", "2026-10-25"], today, [], 2).current).toBe(3);
    expect(computeStreak(["2026-10-23"], today, [], 2).current).toBe(1);
  });
  it("breaks it after three missed days", () => {
    expect(computeStreak(["2026-10-20", "2026-10-21", "2026-10-25"], today, [], 2).current).toBe(1);
    expect(computeStreak(["2026-10-22"], today, [], 2).current).toBe(0);
  });
  it("without rest days, one missed day still breaks it", () => {
    expect(computeStreak(["2026-10-23", "2026-10-25"], today).current).toBe(1);
  });
});

describe("weekly summary", () => {
  it("starts weeks on Sunday", () => {
    expect(weekStart("2026-10-25")).toBe("2026-10-25"); // Sunday
    expect(weekStart("2026-10-31")).toBe("2026-10-25"); // Saturday
    expect(weekStart("2026-10-24")).toBe("2026-10-18");
  });

  it("counts this week against last week", () => {
    const state = {
      ...initialState(),
      sessions: [
        session("2026-10-20"),
        session("2026-10-25", { planDay: "w1d1", fixedAloud: ["a", "b"] }),
        session("2026-10-26", { planDay: "w1d2" }),
        session("2026-10-26", { id: "x", speakingSeconds: 120, report: undefined, endedAt: undefined }),
      ],
    };
    const { thisWeek, lastWeek } = weeklySummary(state, "2026-10-27");
    expect(thisWeek).toMatchObject({ start: "2026-10-25", daysPracticed: 2, conversations: 2, planDays: 2 });
    expect(thisWeek.fixesSaidAloud).toBe(2);
    expect(thisWeek.minutesSpoken).toBe(12);
    expect(lastWeek).toMatchObject({ start: "2026-10-18", daysPracticed: 1, conversations: 1, planDays: 0 });
  });

  it("lists speaking checks oldest first, with the plan week they closed", () => {
    const state = {
      ...initialState(),
      sessions: [
        session("2026-11-20", { scenarioId: PLACEMENT_ID, planDay: "w4d5", stuckCount: 1 }),
        session("2026-10-20", { scenarioId: PLACEMENT_ID }),
        session("2026-10-21"),
      ],
    };
    const checks = speakingChecks(state);
    expect(checks.map((c) => c.day)).toEqual(["2026-10-20", "2026-11-20"]);
    expect(checks.map((c) => c.week)).toEqual([null, 4]);
    expect(checks[1].stuck).toBe(1);
  });
});

describe("scenario levels", () => {
  it("tags every library conversation except the level check", () => {
    for (const s of SCENARIOS) {
      if (s.id === PLACEMENT_ID) expect(scenarioLevel(s)).toBeNull();
      else expect(["B1", "B1+", "B2"]).toContain(scenarioLevel(s));
    }
  });
  it("plan topics follow their week", () => {
    const topicDays = PLAN_DAYS.filter((d) => d.topic);
    for (const d of topicDays) {
      expect(scenarioLevel(scenarioById(d.scenarioId)!)).toBe(d.week <= 4 ? "B1+" : "B2");
    }
    expect(topicDays.length).toBeGreaterThan(0);
  });
});
