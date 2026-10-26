import { describe, expect, it } from "vitest";
import { levelFromXp, xpForSession, xpToNext } from "@/lib/game/xp";
import { bestStreak, computeStreak, dayKey, friendlyDay } from "@/lib/game/streak";
import { ACHIEVEMENTS, EMPTY_STATS, earned } from "@/lib/game/achievements";

describe("xp", () => {
  it("rewards minutes, mission, fixes, reviews and the daily goal", () => {
    expect(
      xpForSession({
        speakingSeconds: 619,
        missionComplete: true,
        mistakesFixedAloud: 2,
        reviewsDone: 3,
        dailyGoalMet: true,
      }),
    ).toBe(100 + 20 + 30 + 15 + 10);
  });

  it("gives nothing for an empty session", () => {
    expect(
      xpForSession({
        speakingSeconds: 59,
        missionComplete: false,
        mistakesFixedAloud: 0,
        reviewsDone: 0,
        dailyGoalMet: false,
      }),
    ).toBe(0);
  });

  it("levels up on a growing curve", () => {
    expect(xpToNext(1)).toBe(100);
    expect(xpToNext(3)).toBe(200);
    expect(levelFromXp(0)).toEqual({ level: 1, intoLevel: 0, needed: 100 });
    expect(levelFromXp(99)).toEqual({ level: 1, intoLevel: 99, needed: 100 });
    expect(levelFromXp(100)).toEqual({ level: 2, intoLevel: 0, needed: 150 });
    expect(levelFromXp(260)).toEqual({ level: 3, intoLevel: 10, needed: 200 });
  });
});

describe("streak", () => {
  const today = "2026-10-25";

  it("counts consecutive days ending today", () => {
    expect(computeStreak(["2026-10-23", "2026-10-24", "2026-10-25"], today)).toMatchObject({
      current: 3,
      practicedToday: true,
    });
  });

  it("keeps yesterday's streak alive until today ends", () => {
    expect(computeStreak(["2026-10-23", "2026-10-24"], today)).toMatchObject({ current: 2, practicedToday: false });
  });

  it("breaks after a missed day", () => {
    expect(computeStreak(["2026-10-22", "2026-10-23"], today).current).toBe(0);
  });

  it("bridges a frozen day without counting it", () => {
    const r = computeStreak(["2026-10-22", "2026-10-24", "2026-10-25"], today, ["2026-10-23"]);
    expect(r.current).toBe(3);
    expect(r.frozenDays).toEqual(["2026-10-23"]);
  });

  it("finds the best run, ignoring duplicates and order", () => {
    expect(bestStreak(["2026-10-03", "2026-10-01", "2026-10-02", "2026-10-02", "2026-10-10"])).toBe(3);
    expect(bestStreak([])).toBe(0);
  });

  it("formats days in Israel time", () => {
    // 22:30 UTC on Oct 25 is already Oct 26 in Israel (UTC+2 in late October).
    expect(dayKey(new Date("2026-10-25T22:30:00Z"))).toBe("2026-10-26");
  });
});

describe("achievements", () => {
  it("none are earned at the start", () => {
    expect(earned(EMPTY_STATS).size).toBe(0);
  });

  it("are earned exactly at their targets", () => {
    const got = earned({ ...EMPTY_STATS, sessions: 1, bestStreak: 7, totalSpeakingSeconds: 3600, mistakesMastered: 1 });
    expect([...got].sort()).toEqual(["first_words", "fix_1", "minutes_60", "streak_3", "streak_7"]);
  });

  it("report partial progress for locked badges", () => {
    const a = ACHIEVEMENTS.find((x) => x.key === "interview_ready")!;
    expect(a.progress({ ...EMPTY_STATS, interviewScenariosDone: 3 })).toBeCloseTo(0.5);
  });

  it("have unique keys", () => {
    expect(new Set(ACHIEVEMENTS.map((a) => a.key)).size).toBe(ACHIEVEMENTS.length);
  });
});

describe("friendlyDay", () => {
  it("names today and yesterday, then short dates", () => {
    expect(friendlyDay("2026-10-26", "2026-10-26")).toBe("Today");
    expect(friendlyDay("2026-10-25", "2026-10-26")).toBe("Yesterday");
    expect(friendlyDay("2026-10-24", "2026-10-26")).toBe("Sat 24 Oct");
  });
});
