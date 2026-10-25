import { describe, expect, it } from "vitest";
import { SentenceChunker, splitSentences } from "@/lib/text/sentences";

describe("splitSentences", () => {
  it("splits on sentence punctuation", () => {
    expect(splitSentences("That sounds great. How long have you lived there? Tell me more!")).toEqual([
      "That sounds great.",
      "How long have you lived there?",
      "Tell me more!",
    ]);
  });

  it("does not split on abbreviations or decimals", () => {
    expect(splitSentences("I met Dr. Cohen at 3.5 hours past noon, e.g. lunch time. Nice.")).toEqual([
      "I met Dr. Cohen at 3.5 hours past noon, e.g. lunch time.",
      "Nice.",
    ]);
  });

  it("keeps closing quotes with their sentence", () => {
    expect(splitSentences('She said "no way." Then she left the room.')).toEqual([
      'She said "no way."',
      "Then she left the room.",
    ]);
  });

  it("merges very short fragments into the next sentence", () => {
    expect(splitSentences("Oh. I see what you mean now.")).toEqual(["Oh. I see what you mean now."]);
  });
});

describe("SentenceChunker (streaming)", () => {
  it("emits sentences as soon as they are complete across chunk boundaries", () => {
    const c = new SentenceChunker();
    expect(c.push("Hey there, nice to")).toEqual([]);
    expect(c.push(" meet you. So, what do")).toEqual(["Hey there, nice to meet you."]);
    expect(c.push(" you do for work?")).toEqual([]);
    expect(c.flush()).toEqual(["So, what do you do for work?"]);
  });

  it("waits for whitespace after a period before splitting", () => {
    const c = new SentenceChunker();
    expect(c.push("The price is 3.")).toEqual([]);
    expect(c.push("5 dollars, more or less. Okay")).toEqual(["The price is 3.5 dollars, more or less."]);
    expect(c.flush()).toEqual(["Okay"]);
  });

  it("flush on an empty buffer returns nothing", () => {
    expect(new SentenceChunker().flush()).toEqual([]);
  });
});
