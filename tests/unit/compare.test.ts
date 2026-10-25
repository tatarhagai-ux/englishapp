import { describe, expect, it } from "vitest";
import { normalizeWords, saidCorrectly, similarity, wordCount } from "@/lib/text/compare";

describe("say-it-again matching", () => {
  it("ignores case, punctuation and contractions", () => {
    expect(normalizeWords("I've been living in Shoham, for TEN years!")).toEqual([
      "i",
      "have",
      "been",
      "living",
      "in",
      "shoham",
      "for",
      "ten",
      "years",
    ]);
    expect(
      saidCorrectly("i have been living in shoham for ten years", "I've been living in Shoham for ten years."),
    ).toBe(true);
  });

  it("accepts a small recognition slip but not the original mistake", () => {
    const target = "I've been living in Shoham for ten years.";
    expect(saidCorrectly("I've been living in show home for ten years", target)).toBe(true);
    expect(saidCorrectly("I live in Shoham for ten years", target)).toBe(false);
  });

  it("scores from 0 to 1", () => {
    expect(similarity("", "")).toBe(1);
    expect(similarity("hello there", "goodbye friend")).toBe(0);
  });

  it("counts words", () => {
    expect(wordCount("It's called AZ-900.")).toBe(4);
  });
});
