import { describe, expect, it } from "vitest";
import { LISTENING } from "@/content/listening";
import { diffWords } from "@/lib/text/diff";
import { initialState, pickListeningItems, recordListening, statsFrom, LISTENING_RATE_MAX } from "@/lib/learner/model";

describe("listening content", () => {
  it("has unique ids, covers every level and topic", () => {
    expect(new Set(LISTENING.map((l) => l.id)).size).toBe(LISTENING.length);
    expect(new Set(LISTENING.map((l) => l.level))).toEqual(new Set(["B1", "B2", "C1"]));
    expect(new Set(LISTENING.map((l) => l.topic)).size).toBe(5);
  });
});

describe("dictation diff", () => {
  it("marks caught, missed and extra words", () => {
    const { tokens, accuracy } = diffWords(
      "I gonna grab coffee do you want something",
      "I'm gonna grab a coffee. Do you want anything?",
    );
    expect(tokens.filter((t) => t.status === "missed").map((t) => t.word)).toEqual(["am", "a", "anything"]);
    expect(tokens.filter((t) => t.status === "extra").map((t) => t.word)).toEqual(["something"]);
    expect(accuracy).toBeLessThan(0.9);
  });

  it("gives full marks for a perfect answer, ignoring punctuation and case", () => {
    expect(diffWords("is that for here or to go", "Is that for here or to go?").accuracy).toBe(1);
  });
});

describe("adaptive listening speed", () => {
  it("speeds up after three right in a row and slows down after a miss", () => {
    let s = initialState();
    for (const id of ["a", "b", "c"]) s = recordListening(s, id, true);
    expect(s.listening).toMatchObject({ rate: 0.95, correctStreak: 0, xp: 15 });
    s = recordListening(s, "d", false);
    expect(s.listening).toMatchObject({ rate: 0.9, correctStreak: 0, xp: 15, heard: ["a", "b", "c", "d"] });
  });

  it("never goes past the maximum", () => {
    let s = initialState();
    for (let i = 0; i < 60; i++) s = recordListening(s, `x${i}`, true);
    expect(s.listening!.rate).toBe(LISTENING_RATE_MAX);
  });

  it("listening XP counts toward the level", () => {
    const s = recordListening(initialState(), "a", true);
    expect(statsFrom(s, "2026-10-25").xp).toBe(5);
  });

  it("prefers sentences not heard yet", () => {
    const items = [{ id: "a" }, { id: "b" }, { id: "c" }];
    expect(pickListeningItems(items, ["a", "b"], 2, 42)[0].id).toBe("c");
    expect(
      pickListeningItems(items, [], 3, 7)
        .map((i) => i.id)
        .sort(),
    ).toEqual(["a", "b", "c"]);
  });
});
