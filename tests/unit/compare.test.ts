import { describe, expect, it } from "vitest";
import { criterionMet, usedPhrase, normalizeWords, saidCorrectly, similarity, wordCount } from "@/lib/text/compare";

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

describe("criterionMet", () => {
  const c = "Describes recent activities (present perfect or past simple)";
  it("matches exact and paraphrased wording", () => {
    expect(criterionMet([c], c)).toBe(true);
    expect(criterionMet(["Described recent activities using present perfect"], c)).toBe(true);
    expect(criterionMet(["Explained their own actions"], "Explains their own actions (I, not we)")).toBe(true);
  });
  it("doesn't match a different criterion", () => {
    expect(criterionMet(["Talks about at least one future plan"], c)).toBe(false);
    expect(criterionMet([], c)).toBe(false);
  });
});

describe("usedPhrase", () => {
  it("accepts the phrase alone or inside his own sentence", () => {
    expect(usedPhrase("touch base", "touch base")).toBe(true);
    expect(usedPhrase("Let's touch base on Friday.", "touch base")).toBe(true);
    expect(usedPhrase("Lately I've been reading a lot", "Lately I've been…")).toBe(true);
  });
  it("rejects a sentence without it", () => {
    expect(usedPhrase("Let's talk on Friday", "touch base")).toBe(false);
    expect(usedPhrase("database", "base")).toBe(false);
  });
});

describe("chooseAlternative", () => {
  it("keeps the first guess unless a later one clearly matches the target", async () => {
    const { chooseAlternative } = await import("@/lib/text/compare");
    expect(chooseAlternative(["touch bass", "touch base"], "touch base")).toBe("touch base");
    expect(chooseAlternative(["touch base", "touch bass"], "touch base")).toBe("touch base");
    // A wrong sentence isn't rescued by an unrelated alternative.
    expect(chooseAlternative(["I bought new phone", "a boat of you phone"], "I bought a new phone")).toBe(
      "I bought new phone",
    );
    expect(chooseAlternative([], "anything")).toBe("");
  });
});
