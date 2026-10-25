import { describe, expect, it } from "vitest";
import { budgetState, canSpend, monthKey } from "@/lib/cost/budget";
import { llmCostUsd, sttCostUsd, ttsCostUsd } from "@/lib/cost/pricing";

describe("budget", () => {
  it("moves from ok to warning to blocked", () => {
    expect(budgetState(0, 15)).toBe("ok");
    expect(budgetState(11.99, 15)).toBe("ok");
    expect(budgetState(12, 15)).toBe("warning");
    expect(budgetState(15, 15)).toBe("blocked");
    expect(budgetState(1, 0)).toBe("blocked");
  });

  it("checks whether an estimated call fits under the cap", () => {
    expect(canSpend(14.9, 15, 0.05)).toBe(true);
    expect(canSpend(14.9, 15, 0.2)).toBe(false);
  });

  it("keys months in UTC", () => {
    expect(monthKey(new Date("2026-10-31T23:30:00Z"))).toBe("2026-10");
    expect(monthKey(new Date("2027-01-01T00:00:00Z"))).toBe("2027-01");
  });
});

describe("pricing", () => {
  it("prices DeepSeek tokens", () => {
    expect(llmCostUsd("deepseek/deepseek-v3.2", 1_000_000, 1_000_000)).toBeCloseTo(0.52, 5);
  });

  it("falls back to a conservative default for unknown models", () => {
    expect(llmCostUsd("unknown/model", 1_000_000, 0)).toBe(1);
  });

  it("uses the Azure free tier before charging", () => {
    expect(ttsCostUsd(10_000, 0)).toBe(0);
    expect(ttsCostUsd(10_000, 495_000)).toBeCloseTo((5_000 * 15) / 1_000_000, 8);
    expect(sttCostUsd(600, 0)).toBe(0);
    expect(sttCostUsd(3600, 5 * 3600)).toBeCloseTo(1, 8);
  });
});
