import { describe, expect, it } from "vitest";
import { SAY_SETS, sayMissSet, saySetForMistake } from "@/content/say";
import { SEED_ERRORS } from "@/content/learner-seed";
import { HEBREW_PATTERNS } from "@/content/l1/he";
import { checkSay, sayWords } from "@/lib/text/say-check";
import { initialState, openSayMisses, recordSayDrill, recordSayMisses } from "@/lib/learner/model";
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
      // Listed under Grammar or Words and tone.
      expect(["grammar", "usage"], s.id).toContain(HEBREW_PATTERNS.find((p) => p.key === s.pattern)?.area);
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

  it("never lets a full is stand in for has", () => {
    expect(checkSay("He isn't finished yet", ["He hasn't finished yet."]).status).not.toBe("right");
    expect(checkSay("He has not finished yet", ["He hasn't finished yet."]).status).toBe("right");
  });

  it("matches digits to their words", () => {
    expect(checkSay("I've lived here for 10 years", ["I've lived here for ten years."]).status).toBe("right");
    expect(checkSay("I'm 20", ["I'm twenty."]).status).toBe("right");
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

describe("say-it misses", () => {
  const t1 = new Date("2026-10-27T08:00:00Z");
  const t2 = new Date("2026-10-28T08:00:00Z");

  it("every Hebrew sentence is unique, so it can name a miss", () => {
    const all = SAY_SETS.flatMap((s) => s.items.map((i) => i.he));
    expect(new Set(all).size).toBe(all.length);
  });

  it("opens misses and closes them only when said right later", () => {
    let s = recordSayMisses(initialState(t1), ["קניתי טלפון חדש.", "הוא מהנדס."], ["זמן זה כסף."], t1);
    expect(openSayMisses(s)).toEqual(["קניתי טלפון חדש.", "הוא מהנדס."]);
    expect(s.sayMisses?.["זמן זה כסף."]).toEqual({ at: t1.toISOString(), open: false });
    s = recordSayMisses(s, ["הוא מהנדס."], ["קניתי טלפון חדש."], t2);
    expect(openSayMisses(s)).toEqual(["הוא מהנדס."]);
  });

  it("builds a mixed round that keeps each sentence's own rule", () => {
    const set = sayMissSet(["קניתי טלפון חדש.", "אני חייב ללכת.", "not a sentence"]);
    expect(set.items.map((i) => i.pattern)).toEqual(["articles", "modal_to"]);
  });

  it("ignores a miss whose sentence no longer exists", () => {
    const s = recordSayMisses(initialState(t1), ["משפט שנמחק.", "הוא מהנדס."], [], t1);
    expect(openSayMisses(s)).toEqual(["הוא מהנדס."]);
  });

  it("closes a miss made on a device this one hasn't synced with yet", () => {
    const phone = recordSayMisses(initialState(t1), ["הוא מהנדס."], [], t1);
    const laptop = recordSayMisses(initialState(t1), [], ["הוא מהנדס."], t2);
    expect(openSayMisses(mergeStates(phone, laptop))).toEqual([]);
  });

  it("the newer answer wins across devices", () => {
    const phone = recordSayMisses(initialState(t1), ["הוא מהנדס."], [], t1);
    const laptop = recordSayMisses(phone, [], ["הוא מהנדס."], t2);
    expect(openSayMisses(mergeStates(phone, laptop))).toEqual([]);
    expect(openSayMisses(mergeStates(laptop, phone))).toEqual([]);
  });
});

describe("shuffle", () => {
  it("keeps every item and can reorder them", async () => {
    const { shuffle } = await import("@/lib/text/shuffle");
    const items = [1, 2, 3, 4, 5];
    const out = shuffle(items, () => 0);
    expect([...out].sort()).toEqual(items);
    expect(out).not.toEqual(items);
    expect(items).toEqual([1, 2, 3, 4, 5]);
  });
});

describe("trap breaker", () => {
  it("counts sets done perfectly toward the achievement", async () => {
    const { statsFrom } = await import("@/lib/learner/model");
    const { ACHIEVEMENTS } = await import("@/lib/game/achievements");
    const now = new Date("2026-10-27T08:00:00Z");
    let s = initialState(now);
    for (const set of SAY_SETS.slice(0, 5)) s = recordSayDrill(s, set.id, set.items.length, now);
    s = recordSayDrill(s, SAY_SETS[5].id, 4, now);
    const stats = statsFrom(s, "2026-10-27");
    expect(stats.saySetsPerfect).toBe(5);
    expect(ACHIEVEMENTS.find((a) => a.key === "trap_breaker")!.progress(stats)).toBe(1);
  });
});
