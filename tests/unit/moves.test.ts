import { describe, expect, it } from "vitest";
import { MOVES, moveFor, moveRule } from "@/lib/conversation/moves";
import { buildTutorSystemPrompt } from "@/lib/prompts/tutor";
import { chatRequest } from "@/lib/conversation/types";
import { scenarioById } from "@/content/scenarios";

const free = scenarioById("free-your-week")!;
const hotel = scenarioById("abroad-hotel")!;

describe("conversation moves", () => {
  it("every conversation mixes the moves, teaches early, and never asks three times running", () => {
    for (const seed of ["a", "b", "session-123", "xyz-9", "q"]) {
      const seq = Array.from({ length: 22 }, (_, i) => moveFor(i + 1, seed));
      expect(new Set(seq).size).toBe(MOVES.length);
      expect(seq.slice(0, 4)).toContain("teach");
      for (let i = 2; i < seq.length; i++) {
        expect(seq[i] === "ask" && seq[i - 1] === "ask" && seq[i - 2] === "ask").toBe(false);
      }
    }
  });

  it("different conversations run in a different order", () => {
    const orders = new Set(
      ["s1", "s2", "s3", "s4", "s5", "s6"].map((seed) =>
        Array.from({ length: 11 }, (_, i) => moveFor(i + 1, seed)).join(),
      ),
    );
    expect(orders.size).toBeGreaterThan(1);
  });

  it("the tutor gets the move in its own conversations, not in roleplays or the opening", () => {
    const base = { tutorName: "Ava", correctionMode: "gentle" as const, targetKeys: [], wrapUp: false };
    const own = buildTutorSystemPrompt({ ...base, scenario: free, move: "flip" });
    expect(own).toContain("Hand the questions over");
    expect(own).toContain("End with a question only when your move calls for one");
    expect(buildTutorSystemPrompt({ ...base, scenario: hotel, move: "flip" })).not.toContain("Hand the questions over");
    expect(buildTutorSystemPrompt({ ...base, scenario: free, move: "teach", opening: true })).not.toContain(
      "Teaching moment",
    );
    expect(moveRule(undefined)).toBe("");
    expect(chatRequest.safeParse({ scenarioId: "x", history: [], move: "dance" }).success).toBe(false);
  });
});

describe("openings and request limits", () => {
  it("each conversation gets an opening style, spread across the styles, and the tutor is told what to avoid", async () => {
    const { OPENING_STYLES, openingStyleFor } = await import("@/lib/conversation/moves");
    const used = new Set(Array.from({ length: 60 }, (_, i) => openingStyleFor(`session-${i}`).id));
    expect(used.size).toBe(OPENING_STYLES.length);
    const base = { tutorName: "Ava", correctionMode: "gentle" as const, targetKeys: [], wrapUp: false };
    const p = buildTutorSystemPrompt({
      ...base,
      scenario: free,
      format: "story",
      opening: true,
      style: "hot-take",
      avoidOpenings: ["Hey! So, what have you been up to this week?"],
    });
    expect(p).toContain("playful hot take");
    expect(p).toContain("Do not open in a similar way");
    expect(p).toContain("what have you been up to this week");
  });

  it("text the report and memory produce always fits the requests (a long fact or summary once would have broken every later one)", async () => {
    const { CHAT_LIMITS, clampChat } = await import("@/lib/conversation/types");
    const fact = "x".repeat(200);
    const summary = "y".repeat(400);
    const homework = "z".repeat(300);
    expect(
      chatRequest.safeParse({
        scenarioId: "x",
        history: [],
        memory: [fact],
        recent: [`2026-11-04: ${summary}`],
        homework,
        avoidOpenings: ["w".repeat(300)],
      }).success,
    ).toBe(true);
    expect(clampChat("a".repeat(600), CHAT_LIMITS.recent).length).toBeLessThanOrEqual(CHAT_LIMITS.recent);
    expect(clampChat("short", 50)).toBe("short");
  });

  it("recent openings are the tutor's first lines, newest first, without the current conversation", async () => {
    const { recentOpenings, initialState } = await import("@/lib/learner/model");
    const mk = (id: string, at: string, text: string) => ({
      id,
      scenarioId: "free-your-week",
      mode: "voice" as const,
      startedAt: at,
      day: at.slice(0, 10),
      turns: [{ role: "tutor" as const, text }],
      speakingSeconds: 0,
      stuckCount: 0,
      fixedAloud: [],
      xp: 0,
      costUsd: 0,
    });
    const s = {
      ...initialState(),
      sessions: [
        mk("a", "2026-11-01T10:00:00Z", "Opening A"),
        mk("b", "2026-11-02T10:00:00Z", "Opening B"),
        mk("now", "2026-11-03T10:00:00Z", "Scripted fallback"),
      ],
    };
    expect(recentOpenings(s, "now")).toEqual(["Opening B", "Opening A"]);
  });
});

describe("different worlds", () => {
  it("the tutor is asked to link the topic to another area of life, in its own conversations only", () => {
    const base = { tutorName: "Ava", correctionMode: "gentle" as const, targetKeys: [], wrapUp: false };
    expect(buildTutorSystemPrompt({ ...base, scenario: free })).toContain("Travel between worlds");
    expect(buildTutorSystemPrompt({ ...base, scenario: hotel })).not.toContain("Travel between worlds");
  });
});
