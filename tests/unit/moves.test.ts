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
