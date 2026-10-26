import { describe, expect, it } from "vitest";
import { forgetFact, initialState, MEMORY_MAX, memoryForTutor, rememberFacts } from "@/lib/learner/model";
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
    for (let i = 0; i < 20; i++) m = rememberFacts(m, [`fact ${i}`], "2026-10-03");
    expect(m).toHaveLength(MEMORY_MAX);
    expect(m.at(-1)!.text).toBe("fact 19");
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
    expect(buildAnalyzerMessages(free, [])[0].content).toContain("memory: up to 3 short facts");
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
});
