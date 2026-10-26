import { describe, expect, it } from "vitest";
import { analysisSchema, buildAnalyzerMessages, parseAnalysis } from "@/lib/prompts/analyzer";
import { buildTutorSystemPrompt } from "@/lib/prompts/tutor";
import { scenarioById } from "@/content/scenarios";
import { initialState, interviewReadiness, type LearnerState, type SessionRecord } from "@/lib/learner/model";

const interview = scenarioById("interview-star")!;
const casual = scenarioById("free-your-week")!;

function session(id: string, scenarioId: string, answers: Record<string, boolean>[], readiness: number): SessionRecord {
  return {
    id,
    scenarioId,
    mode: "voice",
    startedAt: `2026-10-2${id}T10:00:00Z`,
    endedAt: `2026-10-2${id}T10:10:00Z`,
    day: `2026-10-2${id}`,
    turns: [{ role: "learner", text: "hi", input: "voice" }],
    speakingSeconds: 300,
    stuckCount: 0,
    fixedAloud: [],
    xp: 0,
    costUsd: 0,
    report: analysisSchema.parse({
      interview: { answers: answers.map((a) => ({ question: "q", ...a })), readiness },
    }),
  };
}

describe("interview feedback", () => {
  it("asks the analyzer for answer structure only in interview scenarios", () => {
    const sys = (s = interview) => buildAnalyzerMessages(s, [])[0].content;
    expect(sys()).toContain('"interview":');
    expect(sys()).toContain("result = he ended with an outcome");
    expect(sys(casual)).not.toContain('"interview":');
  });

  it("makes the interviewer follow up on vague answers", () => {
    const p = (s = interview) =>
      buildTutorSystemPrompt({
        scenario: s,
        tutorName: "Ava",
        correctionMode: "gentle",
        targetKeys: [],
        wrapUp: false,
      });
    expect(p()).toContain("Interview follow-ups");
    expect(p(casual)).not.toContain("Interview follow-ups");
  });

  it("parses the interview block leniently and drops a broken one", () => {
    const ok = parseAnalysis(
      JSON.stringify({
        interview: { answers: [{ question: "Why us?", direct: "yes", result: true }], readiness: "4" },
      }),
    );
    expect(ok?.interview?.readiness).toBe(4);
    expect(ok?.interview?.answers[0]).toMatchObject({ direct: false, result: true, example: false });
    const broken = parseAnalysis(JSON.stringify({ interview: "great job" }));
    expect(broken?.interview).toBeUndefined();
  });

  it("tracks readiness and the part he leaves out most", () => {
    const full = { direct: true, example: true, actions: true, result: true };
    const noResult = { ...full, result: false };
    let s: LearnerState = initialState();
    expect(interviewReadiness(s)).toMatchObject({ practiced: 0, total: 5, readiness: null, weakest: null });
    s = {
      ...s,
      sessions: [
        session("1", "interview-star", [noResult, noResult], 2),
        session("2", "interview-about-you", [full, noResult], 4),
      ],
    };
    const r = interviewReadiness(s);
    expect(r.practiced).toBe(2);
    expect(r.readiness).toBe(3);
    expect(r.weakest).toMatchObject({ key: "result", rate: 0.25 });
  });
});
