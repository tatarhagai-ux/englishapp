import { describe, expect, it } from "vitest";
import { DEMO_TURNS, demoAnalysis, demoReply } from "@/lib/client/demo";
import { scenarioById } from "@/content/scenarios";
import { initialState, interviewReadiness, levelHistory, statsFrom, warmupItems } from "@/lib/learner/model";
import type { Turn } from "@/lib/conversation/types";

const free = scenarioById("free-your-week")!;
const interview = scenarioById("interview-star")!;

function history(learnerTurns: number): Turn[] {
  const h: Turn[] = [{ role: "tutor", text: free.opener }];
  for (let i = 0; i < learnerTurns; i++) h.push({ role: "learner", text: `answer ${i}`, input: "text" });
  return h;
}

describe("demo mode", () => {
  it("asks a different follow-up each turn, then wraps up", () => {
    const replies = [1, 2].map((n) => demoReply(free, history(n)));
    expect(new Set(replies).size).toBe(2);
    expect(replies.every((r) => r.endsWith("?"))).toBe(true);
    expect(demoReply(free, history(DEMO_TURNS))).toContain("report");
  });

  it("builds a sample report shaped like a real one", () => {
    const a = demoAnalysis(interview, history(2));
    expect(a.corrections).toHaveLength(2);
    expect(a.task.completed).toBe(true);
    expect(a.interview?.answers).toHaveLength(1);
    expect(demoAnalysis(free, history(1)).interview).toBeUndefined();
  });

  it("never counts toward progress", () => {
    const s = initialState();
    const day = new Date().toISOString().slice(0, 10);
    s.sessions.push({
      id: "d1",
      scenarioId: "interview-star",
      mode: "quiet",
      startedAt: new Date().toISOString(),
      endedAt: new Date().toISOString(),
      day,
      turns: history(2),
      speakingSeconds: 300,
      stuckCount: 0,
      fixedAloud: [],
      xp: 0,
      costUsd: 0,
      demo: true,
      report: demoAnalysis(interview, history(2)),
    });
    expect(statsFrom(s, day).sessions).toBe(0);
    expect(levelHistory(s)).toEqual([]);
    expect(warmupItems(s)).toEqual([]);
    expect(interviewReadiness(s).practiced).toBe(0);
  });
});
