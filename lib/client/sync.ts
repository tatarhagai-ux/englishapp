"use client";

import { useSyncExternalStore } from "react";
import { learner, onLearnerChange } from "@/lib/client/learner";
import type { LearnerState } from "@/lib/learner/model";

/**
 * Sync between devices, with no sign-in of its own: the access code already says who you
 * are. localStorage stays the source of truth on each device, so the app works offline;
 * the server (/api/sync) merges this copy with the one in Supabase and sends back the
 * result. It runs at start, a few seconds after each change, when the app comes back to
 * the front and when the connection returns.
 */

export type SyncStatus =
  | { kind: "off" }
  | { kind: "syncing"; lastSyncedAt?: string }
  | { kind: "synced"; lastSyncedAt: string }
  | { kind: "error"; message: string; lastSyncedAt?: string };

export const syncConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

let status: SyncStatus = syncConfigured ? { kind: "syncing" } : { kind: "off" };
const listeners = new Set<() => void>();
function setStatus(next: SyncStatus) {
  status = next;
  listeners.forEach((l) => l());
}
const SERVER_STATUS: SyncStatus = { kind: "off" };

export function useSyncStatus(): SyncStatus {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => status,
    () => SERVER_STATUS,
  );
}

const ERROR_TEXT: Record<string, string> = {
  unauthorized: "Unlock the app again to keep syncing.",
  sync_forbidden: "The server can't open your backup. The app secret may have changed.",
  not_configured: "Sync isn't set up on the server yet.",
};

let running: Promise<void> | null = null;
let again = false;
let lastSynced = "";

async function run(): Promise<void> {
  if (!syncConfigured) return;
  const prevAt = "lastSyncedAt" in status ? status.lastSyncedAt : undefined;
  setStatus({ kind: "syncing", lastSyncedAt: prevAt });
  try {
    const res = await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ doc: learner.get() }),
    });
    const data = (await res.json().catch(() => ({}))) as { doc?: LearnerState; error?: string };
    if (!res.ok || !data.doc) throw new Error(data.error ?? (res.status === 401 ? "unauthorized" : "network"));
    lastSynced = JSON.stringify(data.doc);
    if (lastSynced !== JSON.stringify(learner.get())) learner.replace(data.doc);
    setStatus({ kind: "synced", lastSyncedAt: new Date().toISOString() });
  } catch (err) {
    const code = (err as Error).message;
    setStatus({
      kind: "error",
      message:
        navigator.onLine === false
          ? "You're offline. It will sync when you're back."
          : (ERROR_TEXT[code] ?? "Couldn't sync just now. It will try again."),
      lastSyncedAt: prevAt,
    });
  }
}

/** Sync now, or right after the one in flight. Never two at once. */
export function syncNow(): Promise<void> {
  if (running) {
    again = true;
    return running;
  }
  running = run().finally(() => {
    running = null;
    if (again) {
      again = false;
      void syncNow();
    }
  });
  return running;
}

/** Called once from the app shell. */
export function startAutoSync(): () => void {
  if (!syncConfigured) return () => {};
  let timer: ReturnType<typeof setTimeout> | undefined;
  void syncNow();
  const offChange = onLearnerChange(() => {
    // The merge we just saved fires this too; only real local edits need a push.
    if (JSON.stringify(learner.get()) === lastSynced) return;
    clearTimeout(timer);
    timer = setTimeout(() => void syncNow(), 4000);
  });
  const onVisible = () => {
    if (document.visibilityState === "visible") void syncNow();
  };
  const onOnline = () => void syncNow();
  document.addEventListener("visibilitychange", onVisible);
  window.addEventListener("online", onOnline);
  return () => {
    clearTimeout(timer);
    offChange();
    document.removeEventListener("visibilitychange", onVisible);
    window.removeEventListener("online", onOnline);
  };
}
