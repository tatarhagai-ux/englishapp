import { describe, expect, it } from "vitest";
import { SCENARIOS, CATEGORY_INFO } from "@/content/scenarios";
import { voiceById } from "@/content/voices";
import { SEED_ERRORS } from "@/content/learner-seed";

const seedKeys = new Set(SEED_ERRORS.map((e) => e.key));

describe("scenario library", () => {
  it("has unique ids", () => {
    expect(new Set(SCENARIOS.map((s) => s.id)).size).toBe(SCENARIOS.length);
  });

  it("has exactly 5 interview scenarios (the Interview ready achievement counts them)", () => {
    expect(SCENARIOS.filter((s) => s.category === "interview")).toHaveLength(5);
  });

  it.each(SCENARIOS.map((s) => [s.id, s] as const))("%s is complete and useful", (_id, s) => {
    expect(CATEGORY_INFO[s.category]).toBeDefined();
    if (s.voiceId !== null) {
      expect(voiceById(s.voiceId), "voice exists").toBeDefined();
      expect(s.role, "roleplays need a role").toBeTruthy();
    }
    expect(s.task.length).toBeGreaterThan(20);
    expect(s.successCriteria.length).toBeGreaterThanOrEqual(2);
    expect(s.targets.length).toBeGreaterThanOrEqual(1);
    for (const t of s.targets) expect(seedKeys.has(t), `target ${t} is a known mistake`).toBe(true);
    expect(s.phrases.length).toBeGreaterThanOrEqual(3);
    expect(s.opener.trim().endsWith("?"), "opener invites a reply").toBe(true);
    expect(s.minutes).toBeGreaterThanOrEqual(s.hidden ? 3 : 5);
  });

  it("every known mistake is practiced by at least one scenario", () => {
    const practiced = new Set(SCENARIOS.flatMap((s) => s.targets));
    for (const e of SEED_ERRORS) expect(practiced.has(e.key), e.key).toBe(true);
  });
});
