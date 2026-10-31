import { describe, expect, it } from "vitest";
import {
  addFact,
  completeHomework,
  forgetFact,
  initialState,
  MEMORY_MAX,
  memoryForTutor,
  openHomework,
  recentSummaries,
  rememberFacts,
  type SessionRecord,
} from "@/lib/learner/model";
import { stepLinks } from "@/lib/learner/steps";
import { totalScore } from "@/lib/prompts/analyzer";
import { mergeStates } from "@/lib/learner/merge";
import { buildTutorSystemPrompt } from "@/lib/prompts/tutor";
import { buildAnalyzerMessages, parseAnalysis } from "@/lib/prompts/analyzer";
import { scenarioById } from "@/content/scenarios";

const free = scenarioById("free-your-week")!;
const roleplay = scenarioById("abroad-hotel")!;

describe("tutor memory across conversations", () => {
  it("keeps new facts last, replaces repeats, and caps the list", () => {
    let m = rememberFacts([], ["He has an AZ-900 exam in two weeks."], "2026-10-01");
    m = rememberFacts(m, ["He works in an army office.", "he has an AZ-900 exam in two weeks."], "2026-10-02");
    expect(m.map((x) => x.text)).toEqual(["He works in an army office.", "he has an AZ-900 exam in two weeks."]);
    for (let i = 0; i < MEMORY_MAX + 8; i++) m = rememberFacts(m, [`fact ${i}`], "2026-10-03");
    expect(m).toHaveLength(MEMORY_MAX);
    expect(m.at(-1)!.text).toBe(`fact ${MEMORY_MAX + 7}`);
  });

  it("gives the tutor the newest few, newest first, and can forget one", () => {
    const s = { ...initialState(), memory: rememberFacts([], ["a", "b", "c", "d", "e"], "2026-10-01") };
    expect(memoryForTutor(s, 3)).toEqual(["e", "d", "c"]);
    expect(memoryForTutor(forgetFact(s, "e"), 2)).toEqual(["d", "c"]);
  });

  it("the tutor picks it up in its own conversations, not in roleplays", () => {
    const input = { tutorName: "Ava", correctionMode: "gentle" as const, targetKeys: [], wrapUp: false };
    const memory = ["He has a driving test on Friday."];
    expect(buildTutorSystemPrompt({ ...input, scenario: free, memory })).toContain("driving test on Friday");
    expect(buildTutorSystemPrompt({ ...input, scenario: roleplay, memory })).not.toContain("driving test");
  });

  it("the analyzer asks for facts and tolerates a bad memory field", () => {
    expect(buildAnalyzerMessages(free, [])[0].content).toContain("memory: up to 4 short facts");
    expect(parseAnalysis(JSON.stringify({ memory: ["He runs every morning."] }))?.memory).toEqual([
      "He runs every morning.",
    ]);
    expect(parseAnalysis(JSON.stringify({ memory: "lots" }))?.memory).toEqual([]);
  });

  it("merges memory from two devices", () => {
    const a = { ...initialState(), memory: rememberFacts([], ["x"], "2026-10-01") };
    const b = { ...initialState(), memory: rememberFacts([], ["y", "X"], "2026-10-02") };
    expect(mergeStates(a, b).memory?.map((m) => m.text)).toEqual(["X", "y"]);
    expect(mergeStates(a, b)).toEqual(mergeStates(b, a));
  });

  it("drops facts the report says are out of date", () => {
    let m = rememberFacts([], ["He is saving for a laptop.", "He runs."], "2026-10-01");
    m = rememberFacts(m, ["He bought a laptop for 3000 shekels."], "2026-10-05", ["he is saving for a laptop."]);
    expect(m.map((x) => x.text)).toEqual(["He runs.", "He bought a laptop for 3000 shekels."]);
  });

  it("sends the tutor the newest facts within a size budget", () => {
    const long = "x".repeat(150);
    const s = { ...initialState(), memory: rememberFacts([], [`${long}1`, `${long}2`, "short"], "2026-10-01") };
    expect(memoryForTutor(s, 10, 155)).toEqual(["short"]);
    expect(memoryForTutor(s, 10, 300)).toEqual(["short", `${long}2`]);
  });

  it("a fact he deleted on one device stays deleted after sync, and he can add one himself", () => {
    const base = { ...initialState(), memory: rememberFacts([], ["He runs."], "2026-10-01") };
    const a = forgetFact(base, "He runs.", new Date("2026-10-02T10:00:00Z"));
    expect(mergeStates(a, base).memory ?? []).toEqual([]);
    expect(mergeStates(base, a).memory ?? []).toEqual([]);
    const added = addFact(a, "  He reads Never Split the Difference. ", new Date("2026-10-03T10:00:00Z"));
    expect(added.memory?.map((m) => m.text)).toEqual(["He reads Never Split the Difference."]);
    expect(addFact(a, "x").memory).toEqual([]);
  });

  it("recent conversation notes and homework come from the latest reports", () => {
    const session = (id: string, at: string, extra: Partial<SessionRecord["report"]> = {}): SessionRecord => ({
      id,
      scenarioId: "free-your-week",
      mode: "voice",
      startedAt: at,
      day: at.slice(0, 10),
      turns: [],
      speakingSeconds: 0,
      stuckCount: 0,
      fixedAloud: [],
      xp: 0,
      costUsd: 0,
      report: { ...parseAnalysis("{}")!, ...extra },
    });
    const s = {
      ...initialState(),
      sessions: [
        session("a", "2026-10-01T10:00:00Z", {
          summary_en: "Talked about the army.",
          homework: { task_en: "Old", task_he: "" },
        }),
        session("b", "2026-10-02T10:00:00Z", {
          summary_en: "Talked about a laptop.",
          homework: { task_en: "New", task_he: "" },
        }),
        session("c", "2026-10-03T10:00:00Z"),
      ],
    };
    expect(recentSummaries(s)).toEqual(["2026-10-02: Talked about a laptop.", "2026-10-01: Talked about the army."]);
    expect(openHomework(s)?.task).toBe("New");
    expect(openHomework(completeHomework(s, "b"))).toBeNull();
    const merged = mergeStates(completeHomework(s, "b"), s);
    expect(merged.sessions.find((x) => x.id === "b")?.homeworkDone).toBe(true);
  });

  it("the tutor hears recent notes and the homework, the analyzer sees what is remembered", () => {
    const input = { tutorName: "Ava", correctionMode: "gentle" as const, targetKeys: [], wrapUp: false };
    const p = buildTutorSystemPrompt({
      ...input,
      scenario: free,
      recent: ["2026-10-02: a laptop"],
      homework: "Use since",
    });
    expect(p).toContain("a laptop");
    expect(p).toContain('"Use since"');
    expect(buildAnalyzerMessages(free, [], ["He runs."])[0].content).toContain("- He runs.");
  });
});

describe("lesson summary", () => {
  it("parses scores, rounds them and computes a weighted total", () => {
    const a = parseAnalysis(
      JSON.stringify({
        score: { fluency: "61.6", accuracy: 50, range: 40, task: 100 },
        homework: { task_en: "Do it" },
      }),
    )!;
    expect(a.score).toMatchObject({ fluency: 62, accuracy: 50 });
    expect(totalScore(a.score!)).toBe(Math.round(62 * 0.3 + 50 * 0.3 + 40 * 0.2 + 100 * 0.2));
    expect(a.homework?.task_en).toBe("Do it");
    expect(parseAnalysis(JSON.stringify({ score: { fluency: 400 } }))?.score).toBeUndefined();
    expect(parseAnalysis(JSON.stringify({ next_steps: [{ kind: "teleport" }] }))?.next_steps).toEqual([]);
  });

  it("only links to real Say it sets and known mistakes, once each", () => {
    const errors = { missing_be: { key: "missing_be", title: "Missing is/are" } } as never;
    const links = stepLinks(
      [
        { kind: "say", target: "for-and-since", why_en: "a", why_he: "" },
        { kind: "say", target: "made-up", why_en: "", why_he: "" },
        { kind: "mistake", target: "missing_be", why_en: "", why_he: "" },
        { kind: "mistake", target: "nope", why_en: "", why_he: "" },
        { kind: "cards", target: "", why_en: "", why_he: "" },
        { kind: "cards", target: "", why_en: "", why_he: "" },
      ],
      { errors },
    );
    expect(links.map((l) => l.href)).toEqual(["/say/for-and-since", "/mistakes/missing_be", "/words"]);
  });
});
