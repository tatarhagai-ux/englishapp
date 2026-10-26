import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHash, createHmac } from "node:crypto";

vi.mock("server-only", () => ({}));

const SECRET = "s".repeat(40);
const calls: { url: string; body: Record<string, unknown> }[] = [];
let stored: unknown = null;

beforeEach(() => {
  vi.resetModules();
  calls.length = 0;
  stored = null;
  vi.stubEnv("APP_SESSION_SECRET", SECRET);
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key-123456");
  const expected = createHmac("sha256", SECRET).update("speakwise-sync-v1").digest("hex");
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body)) as Record<string, unknown>;
      calls.push({ url, body });
      // Like the database: only the right token's hash is accepted.
      const hash = createHash("sha256").update(String(body.p_token)).digest("hex");
      const want = createHash("sha256").update(expected).digest("hex");
      if (hash !== want) return new Response('{"message":"sync not allowed"}', { status: 400 });
      if (url.endsWith("speakwise_sync_pull")) return new Response(JSON.stringify(stored), { status: 200 });
      stored = body.p_doc;
      return new Response(null, { status: 204 });
    }),
  );
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

async function post(doc: unknown) {
  const { POST } = await import("@/app/api/sync/route");
  return POST(new Request("http://x/api/sync", { method: "POST", body: JSON.stringify({ doc }) }));
}

describe("POST /api/sync", () => {
  it("stores the first copy, writes nothing when unchanged, merges another device's copy", async () => {
    const { initialState } = await import("@/lib/learner/model");
    const phone = initialState(new Date("2026-10-26T08:00:00Z"));
    const first = await post(phone);
    expect(first.status).toBe(200);
    expect(stored).toMatchObject({ v: 1 });
    // The same copy again: nothing changed, so nothing is written.
    const again = await post(JSON.parse(JSON.stringify(stored)));
    expect(again.status).toBe(200);
    expect(calls.map((c) => c.url.split("/rpc/")[1])).toEqual([
      "speakwise_sync_pull",
      "speakwise_sync_push",
      "speakwise_sync_pull",
    ]);
    // Another device's copy is merged in and written back.
    const laptop = await post(initialState(new Date("2026-10-26T09:00:00Z")));
    expect(laptop.status).toBe(200);
    expect(calls.at(-1)?.url).toMatch(/speakwise_sync_push$/);
  });

  it("never sends the app secret itself, only the derived token", async () => {
    const { initialState } = await import("@/lib/learner/model");
    await post(initialState());
    expect(JSON.stringify(calls)).not.toContain(SECRET);
  });

  it("explains a refused token instead of failing silently", async () => {
    vi.stubEnv("APP_SESSION_SECRET", "t".repeat(40));
    const { initialState } = await import("@/lib/learner/model");
    const res = await post(initialState());
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "sync_forbidden" });
  });

  it("rejects anything that isn't a learner document", async () => {
    const res = await post({ v: 2 });
    expect(res.status).toBe(400);
  });
});
