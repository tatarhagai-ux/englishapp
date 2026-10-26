import { describe, expect, it } from "vitest";
import { blankOut } from "@/lib/text/cloze";
import { DECKS } from "@/content/decks";

describe("blankOut", () => {
  it("blanks the exact phrase, any case", () => {
    expect(blankOut("Let's touch base on Thursday.", "touch base")).toBe("Let's _____ on Thursday.");
    expect(blankOut("Deadlines give leverage.", "deadline")).toBe("_____ give leverage.");
  });

  it("finds an inflected first word", () => {
    expect(blankOut("I'm cutting down on sugar.", "cut down on")).toBe("I'm _____ sugar.");
    expect(blankOut("She came up with a plan.", "come up with")).toBeNull();
    expect(blankOut("I'm saving up for a laptop.", "save up")).toBe("I'm _____ for a laptop.");
  });

  it("ignores quotes and a leading 'to'", () => {
    expect(blankOut('You want to hear "that\'s right".', '"That\'s right"')).toBe('You want to hear "_____".');
    expect(blankOut("I try to diversify.", "to diversify")).toBe("I try to _____.");
  });

  it("can blank most pack examples", () => {
    const words = DECKS.flatMap((d) => d.words);
    const blanked = words.filter((w) => blankOut(w.example, w.text) !== null);
    expect(blanked.length / words.length).toBeGreaterThan(0.85);
  });
});
