import { describe, expect, it } from "vitest";
import {
  applyAnalysis,
  averageWpm,
  currentSpeakingLevel,
  hasPlacement,
  levelHistory,
  duePhrases,
  initialState,
  rankedErrors,
  recommendScenario,
  reviewMistake,
  reviewPhrase,
  sessionXp,
  statsFrom,
  targetKeysForNext,
  warmupItems,
  type LearnerState,
  type SessionRecord,
} from "@/lib/learner/model";
import { analysisSchema, type Analysis } from "@/lib/prompts/analyzer";

const NOW = new Date("2026-10-25T10:00:00Z");

function session(over: Partial<SessionRecord> = {}): SessionRecord {
  return {
    id: "s1",
    scenarioId: "free-your-week",
    mode: "voice",
    startedAt: NOW.toISOString(),
    endedAt: NOW.toISOString(),
    day: "2026-10-25",
    turns: [
      { role: "tutor", text: "Hi?" },
      { role: "learner", text: "Hello", input: "voice" },
    ],
    speakingSeconds: 300,
    stuckCount: 0,
    fixedAloud: [],
    xp: 0,
    costUsd: 0,
    ...over,
  };
}

function analysis(partial: Partial<Record<keyof Analysis, unknown>>): Analysis {
  return analysisSchema.parse(partial);
}

function withSession(s: SessionRecord = session()): LearnerState {
  return { ...initialState(NOW), sessions: [s] };
}

describe("learner model", () => {
  it("starts with the 8 placement mistakes as new", () => {
    const s = initialState(NOW);
    expect(Object.keys(s.errors)).toHaveLength(8);
    expect(Object.values(s.errors).every((e) => e.status === "new")).toBe(true);
  });

  it("moves a mistake new → practicing → mastered over clean sessions, and back on a relapse", () => {
    const used = analysis({ correct_uses: ["present_perfect_duration"] });
    let s = applyAnalysis(withSession(), "s1", used, NOW);
    expect(s.errors.present_perfect_duration.status).toBe("practicing");
    s = applyAnalysis(s, "s1", used, NOW);
    expect(s.errors.present_perfect_duration.status).toBe("mastered");

    s = applyAnalysis(
      s,
      "s1",
      analysis({
        corrections: [
          {
            original: "I live here two years",
            better: "I've lived here for two years",
            why_en: "x",
            error_key: "present_perfect_duration",
          },
        ],
      }),
      NOW,
    );
    expect(s.errors.present_perfect_duration).toMatchObject({ status: "practicing", cleanSessions: 0, occurrences: 2 });
  });

  it("does not count a correct use in a session where the same mistake was also made", () => {
    const s = applyAnalysis(
      withSession(),
      "s1",
      analysis({
        corrections: [{ original: "a", better: "b", why_en: "x", error_key: "missing_be" }],
        correct_uses: ["missing_be"],
      }),
      NOW,
    );
    expect(s.errors.missing_be).toMatchObject({ status: "new", correctUses: 0 });
  });

  it("adds new mistakes with a readable title and saves the report", () => {
    const s = applyAnalysis(
      withSession(),
      "s1",
      analysis({
        corrections: [
          { original: "I am agree", better: "I agree", why_en: "agree is a verb", why_he: "x", error_key: "be_agree" },
        ],
      }),
      NOW,
    );
    expect(s.errors.be_agree).toMatchObject({ title: "Be agree", example: "I am agree", status: "new" });
    expect(s.sessions[0].report?.corrections).toHaveLength(1);
  });

  it("adds phrases once, case-insensitively", () => {
    const a = analysis({ phrases: [{ text: "touch base" }, { text: "Touch base" }, { text: "follow up" }] });
    let s = applyAnalysis(withSession(), "s1", a, NOW);
    s = applyAnalysis(s, "s1", a, NOW);
    expect(s.phrases.map((p) => p.text)).toEqual(["touch base", "follow up"]);
  });

  it("ranks frequent unmastered mistakes first and picks targets", () => {
    let s = withSession();
    s = { ...s, errors: { ...s.errors, missing_be: { ...s.errors.missing_be, occurrences: 5 } } };
    expect(rankedErrors(s)[0].key).toBe("missing_be");
    expect(targetKeysForNext(s)).toHaveLength(3);
    expect(targetKeysForNext(s)[0]).toBe("missing_be");
  });

  it("recommends a scenario for the top mistake and avoids repeating the last one", () => {
    let s = withSession(session({ scenarioId: "interview-strengths" }));
    s = { ...s, errors: { ...s.errors, missing_be: { ...s.errors.missing_be, occurrences: 9 } } };
    const rec = recommendScenario(s);
    expect(rec.targets).toContain("missing_be");
    expect(rec.id).not.toBe("interview-strengths");
  });

  it("computes stats for achievements", () => {
    const s: LearnerState = {
      ...initialState(NOW),
      sessions: [
        session({
          id: "a",
          day: "2026-10-24",
          scenarioId: "interview-about-you",
          xp: 40,
          report: analysis({ task: { completed: true } }),
        }),
        session({ id: "b", day: "2026-10-25", scenarioId: "abroad-airport", stuckCount: 2, xp: 30 }),
        session({ id: "c", day: "2026-10-25", turns: [{ role: "tutor", text: "Hi?" }] }),
      ],
    };
    expect(statsFrom(s, "2026-10-25")).toMatchObject({
      sessions: 2,
      totalSpeakingSeconds: 600,
      currentStreak: 2,
      interviewScenariosDone: 1,
      accentsHeard: 2,
      stuckFreeSessions: 1,
      xp: 70,
    });
  });

  it("gives the daily-goal bonus only to the session that crosses the goal", () => {
    const s = session({ speakingSeconds: 6 * 60 });
    expect(sessionXp(s, 8, 12)).toBe(60 + 10);
    expect(sessionXp(s, 13, 12)).toBe(60);
  });

  it("schedules phrase reviews, surviving a JSON round trip", () => {
    let s = applyAnalysis(withSession(), "s1", analysis({ phrases: [{ text: "touch base" }] }), NOW);
    expect(duePhrases(s, NOW)).toHaveLength(1);
    s = JSON.parse(JSON.stringify(s));
    s = reviewPhrase(s, "touch base", true, NOW);
    expect(duePhrases(s, NOW)).toHaveLength(0);
    expect(new Date(s.phrases[0].card.due).getTime()).toBeGreaterThan(NOW.getTime());
  });
});

describe("warm-up", () => {
  it("has nothing before the first real conversation", () => {
    expect(warmupItems(initialState(NOW), NOW)).toEqual([]);
  });

  it("starts with the top two sayable placement mistakes", () => {
    const items = warmupItems(withSession(), NOW);
    expect(items.map((i) => i.id)).toEqual(["present_perfect_duration", "looking_forward_to_ing"]);
    expect(items[0]).toMatchObject({ kind: "mistake", target: "I've been living in Shoham for ten years." });
  });

  it("skips explanations that are not one sentence", () => {
    const s = withSession();
    for (const k of Object.keys(s.errors))
      if (k !== "office_idioms" && k !== "answer_all_parts") s.errors[k].status = "mastered";
    expect(warmupItems(s, NOW)).toEqual([]);
  });

  it("does not repeat a mistake until its review is due, and adds due phrases", () => {
    let s = reviewMistake(initialState(NOW), "present_perfect_duration", true, NOW);
    s = reviewMistake(s, "looking_forward_to_ing", true, NOW);
    s = applyAnalysis({ ...s, sessions: [session()] }, "s1", analysis({ phrases: [{ text: "a smart move" }] }), NOW);
    const items = warmupItems(s, NOW);
    expect(items.map((i) => i.id)).not.toContain("present_perfect_duration");
    expect(items.some((i) => i.kind === "phrase" && i.target === "a smart move")).toBe(true);
    const later = new Date(NOW.getTime() + 30 * 86_400_000);
    expect(warmupItems(s, later).map((i) => i.id)).toContain("present_perfect_duration");
  });

  it("counts warm-up reviews in session XP", () => {
    expect(sessionXp(session({ speakingSeconds: 60, reviewsDone: 3 }), 0, 12)).toBe(10 + 15);
  });
});

describe("speaking level", () => {
  const withLevel = (id: string, day: string, cefr: string, confidence = "medium", scenarioId = "free-your-week") =>
    session({ id, day, scenarioId, report: analysis({ level: { cefr, confidence } }) });

  it("falls back to the placement quiz until there are estimates", () => {
    expect(currentSpeakingLevel(initialState(NOW), "B1+")).toBe("B1+");
  });

  it("uses the median of the last five confident estimates", () => {
    const s: LearnerState = {
      ...initialState(NOW),
      sessions: [
        withLevel("a", "2026-10-20", "C2", "low"),
        withLevel("b", "2026-10-21", "B1"),
        withLevel("c", "2026-10-22", "B2"),
        withLevel("d", "2026-10-23", "B1+"),
        withLevel("e", "2026-10-24", "C1"),
        withLevel("f", "2026-10-25", "B2", "high", "placement"),
      ],
    };
    expect(levelHistory(s).map((p) => p.cefr)).toEqual(["B1", "B2", "B1+", "C1", "B2"]);
    expect(currentSpeakingLevel(s, "B1+")).toBe("B2");
    expect(hasPlacement(s)).toBe(true);
    expect(levelHistory(s).at(-1)?.placement).toBe(true);
  });

  it("ignores an invalid level instead of failing the whole report", () => {
    expect(analysisSchema.parse({ level: { cefr: "Z9" } }).level).toBeUndefined();
  });

  it("averages words per minute over voice conversations only", () => {
    const s: LearnerState = {
      ...initialState(NOW),
      sessions: [
        session({
          speakingSeconds: 60,
          turns: [{ role: "learner", text: "one two three four five six", input: "voice" }],
        }),
        session({
          id: "q",
          mode: "quiet",
          speakingSeconds: 60,
          turns: [{ role: "learner", text: "x ".repeat(500), input: "text" }],
        }),
      ],
    };
    expect(averageWpm(s, (t) => t.trim().split(/\s+/).length)).toBe(6);
  });

  it("never recommends the hidden level check", () => {
    for (let i = 0; i < 5; i++) expect(recommendScenario(initialState(NOW)).hidden).toBeFalsy();
  });
});
