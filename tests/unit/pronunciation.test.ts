import { describe, expect, it } from "vitest";
import { PRONUNCIATION } from "@/content/pronunciation";
import { speakable } from "@/lib/text/speakable";
import { initialState, recordPronunciation } from "@/lib/learner/model";

describe("pronunciation course", () => {
  it.each(PRONUNCIATION.map((u) => [u.id, u] as const))("%s is complete", (_id, u) => {
    expect(u.pairs.length).toBeGreaterThanOrEqual(2);
    expect(u.sentences.length).toBeGreaterThanOrEqual(2);
    expect(u.whyHe).toMatch(/[֐-׿]/);
    expect(u.how.length).toBeGreaterThan(20);
    // At least one side of the first pair must be playable.
    expect(speakable(u.pairs[0][0]) ?? speakable(u.pairs[0][1])).toBeTruthy();
  });

  it("has unique ids", () => {
    expect(new Set(PRONUNCIATION.map((u) => u.id)).size).toBe(PRONUNCIATION.length);
  });
});

describe("speakable", () => {
  it("keeps plain words and strips notes", () => {
    expect(speakable("think")).toBe("think");
    expect(speakable("worked (workt)")).toBe("worked");
    expect(speakable("Could you send me the file? ↗")).toBe("Could you send me the file?");
  });

  it("refuses made-up spellings", () => {
    expect(speakable("work-ed")).toBeNull();
    expect(speakable("a-BOUT")).toBeNull();
  });
});

describe("pronunciation progress", () => {
  it("keeps the best score and counts attempts", () => {
    let s = recordPronunciation(initialState(), "w-v", 71.6);
    s = recordPronunciation(s, "w-v", 64);
    expect(s.pronunciation!["w-v"]).toMatchObject({ best: 72, attempts: 2 });
  });
});
