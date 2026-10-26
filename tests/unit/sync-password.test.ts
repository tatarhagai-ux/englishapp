import { describe, expect, it } from "vitest";
import { passwordProblem, setPassword, signInWithPassword } from "@/lib/client/sync";

describe("password sign-in", () => {
  it("asks for at least 8 characters", () => {
    expect(passwordProblem("1234567")).toMatch(/at least 8/);
    expect(passwordProblem("12345678")).toBeNull();
  });

  it("rejects a short password before calling the server", async () => {
    await expect(setPassword("short")).rejects.toThrow(/at least 8/);
  });

  it("says sync isn't set up when Supabase isn't connected", async () => {
    await expect(signInWithPassword("a@b.co", "whatever1")).rejects.toThrow(/isn't set up/);
  });
});
