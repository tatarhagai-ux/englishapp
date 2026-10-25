import { describe, expect, it } from "vitest";
import { gateToken, isValidGateToken, safeEqual } from "@/lib/auth/gate";

const SECRET = "x".repeat(40);

describe("access gate", () => {
  it("compares strings safely", () => {
    expect(safeEqual("abc", "abc")).toBe(true);
    expect(safeEqual("abc", "abd")).toBe(false);
    expect(safeEqual("abc", "abcd")).toBe(false);
  });

  it("accepts its own token and rejects others", async () => {
    const token = await gateToken(SECRET);
    expect(await isValidGateToken(token, SECRET)).toBe(true);
    expect(await isValidGateToken(token, "y".repeat(40))).toBe(false);
    expect(await isValidGateToken(undefined, SECRET)).toBe(false);
    expect(await isValidGateToken("deadbeef", SECRET)).toBe(false);
  });
});
