import { describe, expect, it } from "vitest";
import { parseImport } from "@/lib/text/import";
import { addPhrases, initialState, markPhrasesUsed, phrasesToPractice, removePhrase } from "@/lib/learner/model";
import { buildTutorSystemPrompt } from "@/lib/prompts/tutor";
import { assistRequest, assistResult } from "@/lib/prompts/assist";
import { scenarioById } from "@/content/scenarios";

const NOW = new Date("2026-10-25T10:00:00Z");

describe("import parsing", () => {
  it("handles numbering, bullets, definitions after a dash, and duplicates", () => {
    expect(
      parseImport(
        "1. tactical empathy\n- calibrated question – a how/what question\n• Tactical empathy\n\nx\nfollow up; touch base",
      ),
    ).toEqual(["tactical empathy", "calibrated question", "follow up", "touch base"]);
  });
});

describe("phrase bank", () => {
  const base = () =>
    addPhrases(
      initialState(NOW),
      [
        { text: "touch base", meaningEn: "check in", meaningHe: "" },
        { text: "Touch base", meaningEn: "dup", meaningHe: "" },
        { text: "tactical empathy", meaningEn: "", meaningHe: "" },
      ],
      "Never Split the Difference",
      NOW,
    );

  it("adds new phrases once, with the tag", () => {
    const { state, added } = base();
    expect(added).toBe(2);
    expect(state.phrases.map((p) => p.tag)).toEqual(["Never Split the Difference", "Never Split the Difference"]);
  });

  it("removes a phrase", () => {
    expect(removePhrase(base().state, "touch base").phrases.map((p) => p.text)).toEqual(["tactical empathy"]);
  });

  it("counts a phrase as used when he says it", () => {
    const s = markPhrasesUsed(base().state, "Let's touch base next week about it");
    expect(s.phrases.find((p) => p.text === "touch base")?.usedCount).toBe(1);
    expect(markPhrasesUsed(s, "nothing relevant")).toBe(s);
  });

  it("picks due phrases for the tutor to practice, then the least used", () => {
    const s = base().state;
    expect(phrasesToPractice(s, NOW, 2)).toHaveLength(2);
    expect(phrasesToPractice(initialState(NOW), NOW)).toEqual([]);
  });

  it("tells the tutor about them", () => {
    const p = buildTutorSystemPrompt({
      scenario: scenarioById("free-your-week")!,
      tutorName: "Ava",
      correctionMode: "gentle",
      targetKeys: [],
      practicePhrases: ["touch base"],
      wrapUp: false,
    });
    expect(p).toContain('Phrases he is learning: "touch base"');
  });
});

describe("define assist", () => {
  it("validates requests and results", () => {
    expect(assistRequest.safeParse({ mode: "define", items: [] }).success).toBe(false);
    expect(assistRequest.safeParse({ mode: "define", items: Array(31).fill("x") }).success).toBe(false);
    expect(assistResult.define.safeParse({ items: [{ text: "touch base" }] }).success).toBe(true);
  });
});
