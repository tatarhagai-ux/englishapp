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

describe("blankOut with objects and dictionary forms", () => {
  it("finds a phrase split by an object or with another pronoun", () => {
    expect(blankOut("Actually, they pushed it back to two.", "push back")).toBe("Actually, they _____ to two.");
    expect(blankOut("We could roll it out across the department.", "roll out")).toBe(
      "We could _____ across the department.",
    );
    expect(blankOut("Let me get that sorted for you.", "get it sorted")).toBe("Let me _____ for you.");
  });

  it("drops be and it's from the dictionary form", () => {
    expect(blankOut("Are you still up for the hike?", "be up for")).toBe("Are you still _____ the hike?");
    expect(blankOut("And the drinks are on us.", "it's on us")).toBe("And the drinks are _____.");
  });
});
