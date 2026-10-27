import { describe, expect, it } from "vitest";
import { SAY_SETS, saySetForMistake } from "@/content/say";
import { SEED_ERRORS } from "@/content/learner-seed";
import { HEBREW_PATTERNS } from "@/content/l1/he";
import { checkSay, sayWords } from "@/lib/text/say-check";
import { initialState, recordSayDrill } from "@/lib/learner/model";
import { mergeStates } from "@/lib/learner/merge";

describe("say-it content", () => {
  it("has unique sets, each tied to a real pattern", () => {
    expect(new Set(SAY_SETS.map((s) => s.id)).size).toBe(SAY_SETS.length);
    for (const s of SAY_SETS) {
      expect(
        HEBREW_PATTERNS.some((p) => p.key === s.pattern),
        s.id,
      ).toBe(true);
      expect(s.items.length).toBeGreaterThanOrEqual(5);
    }
  });

  it("accepts every listed answer and never the trap", () => {
    for (const s of SAY_SETS) {
      for (const item of s.items) {
        for (const a of item.answers) expect(checkSay(a, item.answers).status, a).toBe("right");
        if (item.trap) expect(checkSay(item.trap, item.answers).status, item.trap).not.toBe("right");
        expect(item.he).toMatch(/[֐-׿]/);
      }
    }
  });
});

describe("mistake to set", () => {
  it("links his recurring mistakes and analyzer pattern keys to a set", () => {
    expect(saySetForMistake("present_perfect_duration")?.id).toBe("for-and-since");
    expect(saySetForMistake("articles")?.id).toBe("a-and-the");
    expect(saySetForMistake("office_idioms")).toBeUndefined();
    for (const e of SEED_ERRORS) {
      const set = saySetForMistake(e.key);
      if (set) expect(SAY_SETS).toContain(set);
    }
  });
});

describe("checkSay", () => {
  const answers = ["I bought a new phone."];

  it("counts a single missing article as a miss and names it", () => {
    expect(checkSay("I bought new phone", answers)).toMatchObject({ status: "close", missing: ["a"], extra: [] });
  });

  it("names an extra word", () => {
    expect(checkSay("I must to go", ["I must go."])).toMatchObject({ status: "close", missing: [], extra: ["to"] });
  });

  it("ignores case, punctuation, fillers and please", () => {
    expect(checkSay("um, I BOUGHT a new phone", answers).status).toBe("right");
    expect(checkSay("so could you send me the file please", ["Could you send me the file?"]).status).toBe("right");
  });

  it("treats she's as either she is or she has", () => {
    expect(checkSay("She has been working there since March", ["She's been working there since March."]).status).toBe(
      "right",
    );
    expect(sayWords("I can not")).toEqual(["i", "cannot"]);
  });

  it("calls something unrelated wrong, with the closest answer", () => {
    const r = checkSay("the weather is nice", ["Do you want coffee?", "Would you like some coffee?"]);
    expect(r.status).toBe("wrong");
    expect(r.closest).toBeTruthy();
  });
});

describe("say-it progress", () => {
  it("keeps the best score and merges across devices", () => {
    const now = new Date("2026-10-27T08:00:00Z");
    let s = recordSayDrill(initialState(now), "a-and-the", 4, now);
    s = recordSayDrill(s, "a-and-the", 2, now);
    expect(s.sayDrills?.["a-and-the"].best).toBe(4);
    const other = recordSayDrill(initialState(now), "a-and-the", 6, now);
    expect(mergeStates(s, other).sayDrills?.["a-and-the"].best).toBe(6);
  });
});
