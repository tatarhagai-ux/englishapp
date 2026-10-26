import { describe, expect, it } from "vitest";
import { PLAN, PLAN_DAYS, planScenario } from "@/content/plan";
import { scenarioById } from "@/content/scenarios";
import { analysisSchema } from "@/lib/prompts/analyzer";
import {
  initialState,
  markPhrasesUsed,
  phraseUsedIn,
  type LearnerState,
  type SessionRecord,
} from "@/lib/learner/model";
import { addWeekWords, ownedStretchWords, planPosition, weekWordsToPractice } from "@/lib/learner/plan";

const DAY = "2026-10-27";

function planSession(planDay: string, finished = true, day = DAY): SessionRecord {
  const d = PLAN_DAYS.find((x) => x.key === planDay)!;
  return {
    id: `s-${planDay}-${finished}`,
    scenarioId: d.scenarioId,
    mode: "voice",
    startedAt: `${day}T15:00:00Z`,
    day,
    turns: [],
    speakingSeconds: 300,
    stuckCount: 0,
    fixedAloud: [],
    xp: 0,
    costUsd: 0,
    planDay,
    ...(finished ? { endedAt: `${day}T15:10:00Z`, report: analysisSchema.parse({}) } : {}),
  };
}

const with_ = (s: LearnerState, ...sessions: SessionRecord[]) => ({ ...s, sessions: [...s.sessions, ...sessions] });

describe("the 12-week plan content", () => {
  it("has 12 weeks of 5 days, unique keys, and every day opens a real conversation", () => {
    expect(PLAN).toHaveLength(12);
    expect(PLAN_DAYS).toHaveLength(60);
    expect(new Set(PLAN_DAYS.map((d) => d.key)).size).toBe(60);
    for (const d of PLAN_DAYS) expect(scenarioById(d.scenarioId), d.key).toBeDefined();
  });

  it("gives every week 8 distinct words with English and Hebrew meanings and an example", () => {
    const all = PLAN.flatMap((w) => w.words.map((x) => x.text.toLowerCase()));
    expect(new Set(all).size).toBe(all.length);
    for (const w of PLAN) {
      expect(w.words).toHaveLength(8);
      for (const x of w.words) {
        expect(x.meaningEn.length, x.text).toBeGreaterThan(3);
        expect(x.meaningHe, x.text).toMatch(/[֐-׿]/);
        expect(x.example.length, x.text).toBeGreaterThan(8);
      }
    }
  });

  it("puts the same speaking check at the end of weeks 4, 8 and 12", () => {
    expect(PLAN_DAYS.filter((d) => d.check).map((d) => d.key)).toEqual(["w4d5", "w8d5", "w12d5"]);
  });

  it("builds topic days as tutor conversations with the week's focus", () => {
    const s = planScenario("plan-w1d2")!;
    expect(s.voiceId).toBeNull();
    expect(s.hidden).toBe(true);
    expect(s.tutorNotes).toContain("present perfect");
    expect(planScenario("plan-w99d1")).toBeUndefined();
  });
});

describe("planPosition", () => {
  it("starts at week 1, day 1", () => {
    const p = planPosition(initialState(), DAY);
    expect(p.next?.key).toBe("w1d1");
    expect(p.done).toBe(0);
    expect(p.weekDone).toEqual([false, false, false, false, false]);
  });

  it("moves on only when a day's conversation ended with a report", () => {
    let s = with_(initialState(), planSession("w1d1", false));
    expect(planPosition(s, DAY).next?.key).toBe("w1d1");
    s = with_(s, planSession("w1d1"));
    const p = planPosition(s, DAY);
    expect(p.next?.key).toBe("w1d2");
    expect(p.doneToday).toBe(1);
    expect(p.weekDone[0]).toBe(true);
  });

  it("lets him go ahead on a free day, and a gap just waits", () => {
    const s = with_(initialState(), planSession("w1d1", true, "2026-10-20"), planSession("w1d2"), planSession("w1d3"));
    const p = planPosition(s, DAY);
    expect(p.next?.key).toBe("w1d4");
    expect(p.doneToday).toBe(2);
  });

  it("moves to week 2 after day 5, and reports the end of the plan", () => {
    const week1 = PLAN[0].days.map((d) => planSession(d.key));
    expect(planPosition(with_(initialState(), ...week1), DAY).week.week).toBe(2);
    const all = PLAN_DAYS.map((d) => planSession(d.key));
    const end = planPosition(with_(initialState(), ...all), DAY);
    expect(end.next).toBeNull();
    expect(end.done).toBe(60);
  });

  it("ignores demo sessions", () => {
    const s = with_(initialState(), { ...planSession("w1d1"), demo: true });
    expect(planPosition(s, DAY).next?.key).toBe("w1d1");
  });
});

describe("words of the week", () => {
  it("join the phrase bank once, tagged with the week", () => {
    const once = addWeekWords(initialState(), PLAN[0]);
    const twice = addWeekWords(once, PLAN[0]);
    expect(twice.phrases).toHaveLength(8);
    expect(twice.phrases.every((p) => p.tag === "Week 1")).toBe(true);
  });

  it("are practiced least-used first, and a word used twice counts as his", () => {
    let s = addWeekWords(initialState(), PLAN[0]);
    s = markPhrasesUsed(s, "My routine is simple");
    s = markPhrasesUsed(s, "I like my routine");
    expect(weekWordsToPractice(s, PLAN[0], 8)).not.toContain("routine");
    expect(ownedStretchWords(s)).toBe(1);
  });
});

describe("phraseUsedIn", () => {
  it("counts common forms of a verb saved as “to …”", () => {
    expect(phraseUsedIn("I'm juggling work and study", "to juggle")).toBe(true);
    expect(phraseUsedIn("she juggles a lot", "to juggle")).toBe(true);
    expect(phraseUsedIn("I bumped into Dan", "to bump into")).toBe(true);
    expect(phraseUsedIn("I'm taking up yoga", "to take up")).toBe(true);
    expect(phraseUsedIn("I keep up with the news", "to keep up with")).toBe(true);
  });

  it("doesn't count a different word that merely starts the same", () => {
    expect(phraseUsedIn("a bumpy road", "to bump into")).toBe(false);
    expect(phraseUsedIn("I take the bus", "to take up")).toBe(false);
  });

  it("matches plain phrases as before", () => {
    expect(phraseUsedIn("In the long run it pays off", "in the long run")).toBe(true);
    expect(phraseUsedIn("hi", "ok")).toBe(false);
  });
});
