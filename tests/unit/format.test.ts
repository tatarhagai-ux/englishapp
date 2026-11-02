import { describe, expect, it } from "vitest";
import { FORMATS, SURPRISE_TOPICS } from "@/content/formats";
import { LEVEL_RANK } from "@/content/challenges";
import { formatOptions, nextFormat, nextTopic, pickFormat, pickTopic, themeFor } from "@/lib/learner/format";
import { initialState, type SessionRecord } from "@/lib/learner/model";
import { buildTutorSystemPrompt } from "@/lib/prompts/tutor";
import { scenarioById, SURPRISE_ID } from "@/content/scenarios";

const free = scenarioById("free-your-week")!;
const surprise = scenarioById(SURPRISE_ID)!;
const hotel = scenarioById("abroad-hotel")!;

function withSessions(list: { format?: string; topic?: string }[]) {
  const sessions: SessionRecord[] = list.map((x, i) => ({
    id: `s${i}`,
    scenarioId: SURPRISE_ID,
    mode: "voice",
    startedAt: `2026-10-${String(i + 1).padStart(2, "0")}T10:00:00Z`,
    day: `2026-10-${String(i + 1).padStart(2, "0")}`,
    turns: [{ role: "learner", text: "hello there" }],
    speakingSeconds: 60,
    stuckCount: 0,
    fixedAloud: [],
    xp: 0,
    costUsd: 0,
    ...x,
  }));
  return { ...initialState(), sessions };
}

describe("conversation formats", () => {
  it("has enough formats and topics to keep things fresh", () => {
    expect(FORMATS.length).toBeGreaterThanOrEqual(10);
    expect(SURPRISE_TOPICS.length).toBeGreaterThanOrEqual(60);
    expect(new Set(SURPRISE_TOPICS.map((t) => t.id)).size).toBe(SURPRISE_TOPICS.length);
  });

  it("doesn't repeat the last four formats, and keeps hard ones for later levels", () => {
    const used = ["debate", "story", "what-if", "teach-me"];
    const s = withSessions(used.map((format) => ({ format })));
    for (let d = 1; d <= 25; d++) {
      const f = pickFormat(s, {
        level: "stretch",
        scenarioId: "free-your-week",
        day: `2026-11-${String(d).padStart(2, "0")}`,
      });
      expect(used).not.toContain(f?.id);
    }
    for (const f of formatOptions(initialState(), "easier")) expect(LEVEL_RANK[f.minLevel]).toBe(0);
  });

  it("two conversations on the same day get different formats", () => {
    const opts = { level: "stretch" as const, scenarioId: "free-your-week", day: "2026-11-02" };
    const first = pickFormat(initialState(), opts)!;
    const second = pickFormat(withSessions([{ format: first.id }]), opts)!;
    expect(second.id).not.toBe(first.id);
  });

  it("surprise topics don't repeat for twenty conversations, and Another cycles", () => {
    const seen: { format?: string; topic?: string }[] = [];
    for (let i = 0; i < 20; i++) {
      const t = pickTopic(withSessions(seen), "2026-11-02");
      expect(seen.map((x) => x.topic)).not.toContain(t.id);
      seen.push({ topic: t.id });
    }
    const a = nextTopic(initialState(), "ai-jobs");
    expect(a.id).not.toBe("ai-jobs");
    expect(nextFormat(initialState(), "deep-dive", "stretch")?.id).not.toBe("deep-dive");
  });

  it("the tutor runs the format and opens with a specific question, not a generic one", () => {
    const base = { tutorName: "Ava", correctionMode: "gentle" as const, targetKeys: [], wrapUp: false };
    const p = buildTutorSystemPrompt({ ...base, scenario: surprise, format: "debate", topic: "phones", opening: true });
    expect(p).toContain("Format: debate");
    expect(p).toContain("phones and attention");
    expect(p).toContain("Never open with a generic question");
    const week = buildTutorSystemPrompt({ ...base, scenario: free, format: "story" });
    expect(week).toContain('connected to "your week"');
    expect(buildTutorSystemPrompt({ ...base, scenario: hotel, format: "debate" })).not.toContain("Format: debate");
    expect(themeFor("A normal day in your life")).toBe("a normal day in your life");
  });
});
