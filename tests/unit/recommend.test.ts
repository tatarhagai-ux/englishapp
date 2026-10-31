import { describe, expect, it } from "vitest";
import { practiceSuggestions } from "@/lib/learner/recommend";
import { initialState, type LearnerState, type SessionRecord } from "@/lib/learner/model";
import { parseAnalysis } from "@/lib/prompts/analyzer";

const now = new Date("2026-10-31T12:00:00Z");

function withReport(startedAt: string, steps: unknown[]): LearnerState {
  const session: SessionRecord = {
    id: "a",
    scenarioId: "free-your-week",
    mode: "voice",
    startedAt,
    endedAt: startedAt,
    day: startedAt.slice(0, 10),
    turns: [{ role: "learner", text: "hi there" }],
    speakingSeconds: 60,
    stuckCount: 0,
    fixedAloud: [],
    xp: 0,
    costUsd: 0,
    report: parseAnalysis(JSON.stringify({ next_steps: steps }))!,
  };
  return { ...initialState(now), sessions: [session] };
}

describe("practice suggestions", () => {
  it("a new learner still gets something, and it ends with a one-minute talk", () => {
    const list = practiceSuggestions(initialState(now), now);
    expect(list.length).toBeGreaterThan(0);
    expect(list.at(-1)?.href).toBe("/talk");
    expect(new Set(list.map((s) => s.href)).size).toBe(list.length);
  });

  it("the last report's next steps come first while they are fresh", () => {
    const steps = [{ kind: "say", target: "for-and-since", why_en: "You said 'I study two weeks'." }];
    const fresh = practiceSuggestions(withReport("2026-10-30T18:00:00Z", steps), now);
    expect(fresh[0]).toMatchObject({ href: "/say/for-and-since", why: "You said 'I study two weeks'." });
    const old = practiceSuggestions(withReport("2026-10-20T18:00:00Z", steps), now);
    expect(old[0].href).not.toBe("/say/for-and-since");
  });

  it("missed Say it sentences come before new material", () => {
    const s = { ...initialState(now), sayMisses: { "אני גר פה כבר עשר שנים.": { at: now.toISOString(), open: true } } };
    const list = practiceSuggestions(s, now);
    const misses = list.findIndex((x) => x.href === "/say/misses");
    const story = list.findIndex((x) => x.href.startsWith("/listen/story/"));
    expect(misses).toBeGreaterThanOrEqual(0);
    expect(misses).toBeLessThan(story);
  });
});

describe("score history", () => {
  it("lists scored reports oldest first and counts challenges met", async () => {
    const { scoreHistory } = await import("@/lib/learner/model");
    const mk = (id: string, at: string, report: object, challenge?: string): SessionRecord => ({
      id,
      scenarioId: "free-your-week",
      mode: "voice",
      startedAt: at,
      endedAt: at,
      day: at.slice(0, 10),
      turns: [{ role: "learner", text: "hi there" }],
      speakingSeconds: 60,
      stuckCount: 0,
      fixedAloud: [],
      xp: 0,
      costUsd: 0,
      challenge,
      report: parseAnalysis(JSON.stringify(report))!,
    });
    const score = { fluency: 50, accuracy: 50, range: 50, task: 50 };
    const s = {
      ...initialState(now),
      sessions: [
        mk("b", "2026-10-02T10:00:00Z", { score: { ...score, task: 100 }, challenge: { met: true } }, "pushback"),
        mk("a", "2026-10-01T10:00:00Z", { score }, "curveball"),
        mk("c", "2026-10-03T10:00:00Z", {}),
      ],
    };
    const h = scoreHistory(s);
    expect(h.points.map((p) => [p.id, p.total])).toEqual([
      ["a", 50],
      ["b", 60],
    ]);
    expect([h.challengesMet, h.challengesTried]).toEqual([1, 1]);
  });
});
