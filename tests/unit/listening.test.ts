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

  it("has enough sentences for months of rounds, each one scorable", () => {
    expect(LISTENING.length).toBeGreaterThanOrEqual(100);
    for (const l of LISTENING) expect(diffWords(l.text, l.text).accuracy, l.id).toBe(1);
  });

  it("accepts the full form of spoken shortcuts", () => {
    expect(diffWords("I do not know, I am kind of tired", "I dunno, I'm kinda tired").accuracy).toBe(1);
    expect(diffWords("let me know", "Lemme know").accuracy).toBe(1);
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

describe("listening stories", () => {
  it("are complete: two speakers with real voices, three answerable questions, phrases", async () => {
    const { STORIES } = await import("@/content/stories");
    const { voiceById } = await import("@/content/voices");
    expect(STORIES.length).toBeGreaterThanOrEqual(10);
    expect(new Set(STORIES.map((s) => s.id)).size).toBe(STORIES.length);
    for (const s of STORIES) {
      expect(new Set(s.lines.map((l) => l.voice)).size, s.id).toBeGreaterThanOrEqual(2);
      for (const l of s.lines) expect(voiceById(l.voice), `${s.id} ${l.voice}`).toBeDefined();
      expect(s.questions).toHaveLength(3);
      for (const q of s.questions) expect(q.options[q.answer], q.q).toBeTruthy();
      expect(s.phrases.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("gives XP only for beating his best on a story", async () => {
    const { recordStory } = await import("@/lib/learner/model");
    let s = recordStory(initialState(), "s-gym", 2);
    expect(s.listening!.xp).toBe(10);
    s = recordStory(s, "s-gym", 1);
    expect(s.listening!.xp).toBe(10);
    s = recordStory(s, "s-gym", 3);
    expect(s.listening!.xp).toBe(15);
    expect(s.stories!["s-gym"].best).toBe(3);
  });
});

describe("radio", () => {
  it("has one-host talks with real voices and three answerable questions, reachable by id", async () => {
    const { RADIO } = await import("@/content/radio");
    const { storyById, STORIES } = await import("@/content/stories");
    const { voiceById } = await import("@/content/voices");
    expect(RADIO.length).toBeGreaterThanOrEqual(5);
    const ids = [...STORIES, ...RADIO].map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const r of RADIO) {
      expect(new Set(r.lines.map((l) => l.voice)).size, r.id).toBe(1);
      expect(voiceById(r.lines[0].voice)).toBeDefined();
      expect(r.questions).toHaveLength(3);
      expect(storyById(r.id)).toBe(r);
      // Every phrase worth keeping is actually said in the talk (a verb may be inflected:
      // "do the heavy lifting" is said as "does the heavy lifting").
      const said = r.lines.map((l) => l.text.toLowerCase()).join(" ");
      for (const p of r.phrases) {
        const words = p.text.toLowerCase().split(" ");
        const core = words.length >= 3 ? words.slice(1).join(" ") : words.join(" ");
        expect(said, `${r.id}: ${p.text}`).toContain(core);
      }
    }
  });
});
