import { describe, expect, it } from "vitest";
import { addPhrases, initialState, ratePhrase, recordReading, recordStory } from "@/lib/learner/model";
import { skillProgress } from "@/lib/learner/skills";

const NOW = new Date("2026-10-26T10:00:00Z");

describe("skillProgress", () => {
  it("counts started and steady words, stories, radio and reads", () => {
    let s = addPhrases(
      initialState(NOW),
      [
        { text: "a", meaningEn: "", meaningHe: "", deck: "office" },
        { text: "b", meaningEn: "", meaningHe: "", deck: "office" },
        { text: "c", meaningEn: "", meaningHe: "", deck: "office" },
      ],
      "Office",
      NOW,
    ).state;
    s = ratePhrase(s, "a", 3, NOW);
    // "b" answered right three times over weeks: its next review is far away.
    let t = NOW;
    for (let i = 0; i < 3; i++) {
      s = ratePhrase(s, "b", 3, t);
      t = new Date(s.phrases.find((p) => p.text === "b")!.card.due);
    }
    s = recordStory(s, "s-monday", 3, NOW);
    s = recordStory(s, "r1-ai-assistant", 2, NOW);
    s = recordReading(s, "r-habits", 2, NOW);
    const p = skillProgress(s);
    expect(p.wordsStarted).toBe(2);
    expect(p.wordsSteady).toBe(1);
    expect(p.stories.done).toBe(1);
    expect(p.radio.done).toBe(1);
    expect(p.reads.done).toBe(1);
    expect(p.minuteTalks).toBe(0);
  });
});
