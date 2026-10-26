import "server-only";
import { createHmac } from "node:crypto";
import { env } from "@/lib/env";
import type { LearnerState } from "@/lib/learner/model";
import type { SyncStore } from "./merge-store";

/**
 * Sync with no sign-in of its own: whoever got past the access code is the owner. The
 * server derives a token from APP_SESSION_SECRET and calls two Supabase functions that
 * only accept that token (supabase/migrations/…_speakwise_server_sync.sql). The browser
 * never sees the token.
 */
export function serverSyncConfigured(): boolean {
  return Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY && env.APP_SESSION_SECRET);
}

function syncToken(): string {
  return createHmac("sha256", env.APP_SESSION_SECRET!).update("speakwise-sync-v1").digest("hex");
}

async function rpc(fn: string, body: Record<string, unknown>): Promise<Response> {
  const res = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: {
      apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      Authorization: `Bearer ${env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
    cache: "no-store",
  });
  if (!res.ok) {
    const detail = (await res.text().catch(() => "")).slice(0, 200);
    throw new Error(res.status === 403 || /not allowed/.test(detail) ? "sync_forbidden" : `sync_${res.status}`);
  }
  return res;
}

export const supabaseStore: SyncStore = {
  async pull() {
    const res = await rpc("speakwise_sync_pull", { p_token: syncToken() });
    return ((await res.json()) as LearnerState | null) ?? null;
  },
  async push(doc) {
    await rpc("speakwise_sync_push", { p_token: syncToken(), p_doc: doc });
  },
};
