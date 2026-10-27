import { describe, expect, it } from "vitest";
import { keepScreenOn } from "@/lib/client/wake-lock";

class FakeSentinel {
  released = false;
  async release() {
    this.released = true;
  }
}

function setup(opts: { fail?: boolean } = {}) {
  const locks: FakeSentinel[] = [];
  const listeners = new Set<() => void>();
  const doc = {
    visibilityState: "visible" as DocumentVisibilityState,
    addEventListener: (_: string, fn: () => void) => listeners.add(fn),
    removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
  };
  const nav = {
    wakeLock: {
      request: async () => {
        if (opts.fail) throw new Error("NotAllowedError");
        const s = new FakeSentinel();
        locks.push(s);
        return s;
      },
    },
  };
  const fire = () => listeners.forEach((l) => l());
  return { locks, listeners, doc, nav, fire };
}

const tick = () => new Promise((r) => setTimeout(r, 0));

describe("keepScreenOn", () => {
  it("holds a lock and releases it on cleanup", async () => {
    const t = setup();
    const release = keepScreenOn(t.nav as never, t.doc as never);
    await tick();
    expect(t.locks).toHaveLength(1);
    release();
    await tick();
    expect(t.locks[0].released).toBe(true);
    expect(t.listeners.size).toBe(0);
  });

  it("asks again when the app comes back after the browser dropped the lock", async () => {
    const t = setup();
    keepScreenOn(t.nav as never, t.doc as never);
    await tick();
    t.locks[0].released = true; // the browser drops it in the background
    t.doc.visibilityState = "hidden";
    t.fire();
    await tick();
    expect(t.locks).toHaveLength(1);
    t.doc.visibilityState = "visible";
    t.fire();
    await tick();
    expect(t.locks).toHaveLength(2);
  });

  it("does not stack locks while one is held", async () => {
    const t = setup();
    keepScreenOn(t.nav as never, t.doc as never);
    await tick();
    t.fire();
    t.fire();
    await tick();
    expect(t.locks).toHaveLength(1);
  });

  it("does nothing without support, and survives a refusal", async () => {
    expect(() => keepScreenOn({} as never, setup().doc as never)()).not.toThrow();
    const t = setup({ fail: true });
    const release = keepScreenOn(t.nav as never, t.doc as never);
    await tick();
    expect(() => release()).not.toThrow();
  });
});
