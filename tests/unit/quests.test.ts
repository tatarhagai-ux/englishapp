import { describe, expect, it } from "vitest";
import { initialState, ratePhrase, addPhrases, recordStory } from "@/lib/learner/model";
import { dailyQuests } from "@/lib/learner/quests";

const NOW = new Date("2026-10-26T10:00:00Z");
const TODAY = "2026-10-26";

describe("daily quests", () => {
  it("start empty", () => {
    const q = dailyQuests(initialState(NOW), TODAY, 12);
    expect(q.map((x) => [x.id, x.done])).toEqual([
      ["talk", 0],
      ["words", 0],
      ["listen", 0],
    ]);
  });

  it("count today's card reviews and a story, from what is already stored", () => {
    let s = addPhrases(
      initialState(NOW),
      ["a", "b", "c", "d", "e", "f"].map((t) => ({ text: t, meaningEn: "", meaningHe: "" })),
      undefined,
      NOW,
    ).state;
    for (const t of ["a", "b", "c", "d", "e", "f"]) s = ratePhrase(s, t, 3, NOW);
    s = recordStory(s, "s-gym", 2, NOW);
    const q = dailyQuests(s, TODAY, 12);
    expect(q.find((x) => x.id === "words")).toMatchObject({ done: 5, target: 5 });
    expect(q.find((x) => x.id === "listen")).toMatchObject({ done: 1 });
    // Yesterday's work doesn't count today.
    expect(dailyQuests(s, "2026-10-27", 12).find((x) => x.id === "words")!.done).toBe(0);
  });

  it("counts Say it in English sentences answered today, right or missed", async () => {
    const { recordSayMisses } = await import("@/lib/learner/model");
    const s = recordSayMisses(initialState(NOW), ["הוא מהנדס."], ["זמן זה כסף.", "קניתי טלפון חדש."], NOW);
    expect(dailyQuests(s, TODAY, 12).find((x) => x.id === "words")!.done).toBe(3);
  });
});

describe("perfect week", () => {
  it("keeps perfect days, shows this week's strip, and counts the best week", async () => {
    const { markPerfectDay, perfectWeekStrip, statsFrom } = await import("@/lib/learner/model");
    let s = initialState(NOW);
    // Sunday 25 Oct 2026 to Saturday 31 Oct.
    for (const d of ["2026-10-25", "2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29"]) s = markPerfectDay(s, d);
    s = markPerfectDay(s, "2026-10-26");
    expect(s.perfectDays).toHaveLength(5);
    const strip = perfectWeekStrip(s, TODAY);
    expect(strip).toHaveLength(7);
    expect(strip[0]).toEqual({ day: "2026-10-25", perfect: true });
    expect(strip[6]).toEqual({ day: "2026-10-31", perfect: false });
    expect(statsFrom(s, TODAY).bestPerfectWeek).toBe(5);
  });
});
