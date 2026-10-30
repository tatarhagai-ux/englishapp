import { describe, expect, it } from "vitest";
import { count } from "@/lib/text/plural";

describe("count", () => {
  it("uses the singular only for exactly one", () => {
    expect(count(1, "fix", "fixes")).toBe("1 fix");
    expect(count(0, "fix", "fixes")).toBe("0 fixes");
    expect(count(2, "day")).toBe("2 days");
    expect(count(1, "card")).toBe("1 card");
  });
});
