"use client";

import { useSyncExternalStore } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { learner, onLearnerChange } from "@/lib/client/learner";
import { mergeStates } from "@/lib/learner/merge";
import type { LearnerState } from "@/lib/learner/model";

/**
 * Sync between devices. localStorage stays the source of truth on each device, so the app
 * works offline; when signed in, the whole learner model is also kept as one JSON document
 * per user in Supabase (table learner_state, row level security). Every sync pulls that
 * document, merges it with the local copy (lib/learner/merge.ts) and writes the result to
 * both places.
 */

export type SyncStatus =
  | { kind: "off" }
  | { kind: "signed-out" }
  | { kind: "syncing"; email: string; lastSyncedAt?: string }
  | { kind: "synced"; email: string; lastSyncedAt: string }
  | { kind: "error"; email: string; message: string; lastSyncedAt?: string };

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const syncConfigured = Boolean(SUPABASE_URL && ANON);

/** The two table calls sync needs, so tests can pass a fake. */
export interface SyncStore {
  pull(): Promise<LearnerState | null>;
  push(doc: LearnerState): Promise<void>;
}

/** One round trip. Returns the merged state, which the caller saves locally. */
export async function syncOnce(local: LearnerState, store: SyncStore): Promise<LearnerState> {
  const remote = await store.pull();
  const merged = remote?.v === 1 ? mergeStates(local, remote) : local;
  if (!remote || JSON.stringify(merged) !== JSON.stringify(remote)) await store.push(merged);
  return merged;
}

let client: SupabaseClient | null = null;
function supabase(): SupabaseClient | null {
  if (!syncConfigured) return null;
  // Implicit flow: the sign-in link can open in a different browser than the one that
  // asked for it (the mail app's browser instead of the installed PWA), which PKCE breaks.
  client ??= createClient(SUPABASE_URL!, ANON!, { auth: { flowType: "implicit", persistSession: true } });
  return client;
}

function tableStore(sb: SupabaseClient, userId: string): SyncStore {
  return {
    async pull() {
      const { data, error } = await sb.from("learner_state").select("doc").eq("user_id", userId).maybeSingle();
      if (error) throw new Error(error.message);
      return (data?.doc as LearnerState | undefined) ?? null;
    },
    async push(doc) {
      const { error } = await sb.from("learner_state").upsert({ user_id: userId, doc }, { onConflict: "user_id" });
      if (error) throw new Error(error.message);
    },
  };
}

// Status store ----------------------------------------------------------------------------
let status: SyncStatus = syncConfigured ? { kind: "signed-out" } : { kind: "off" };
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

// Running a sync --------------------------------------------------------------------------
let running: Promise<void> | null = null;
let again = false;
let lastSynced = "";

async function run(): Promise<void> {
  const sb = supabase();
  if (!sb) return;
  const { data } = await sb.auth.getSession();
  const user = data.session?.user;
  if (!user) return setStatus({ kind: "signed-out" });
  const email = user.email ?? "";
  const prevAt = "lastSyncedAt" in status ? status.lastSyncedAt : undefined;
  setStatus({ kind: "syncing", email, lastSyncedAt: prevAt });
  try {
    const merged = await syncOnce(learner.get(), tableStore(sb, user.id));
    lastSynced = JSON.stringify(merged);
    if (lastSynced !== JSON.stringify(learner.get())) learner.replace(merged);
    setStatus({ kind: "synced", email, lastSyncedAt: new Date().toISOString() });
  } catch (err) {
    setStatus({
      kind: "error",
      email,
      message:
        navigator.onLine === false
          ? "You're offline. It will sync when you're back."
          : String((err as Error).message ?? err),
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

/** Called once from the app shell: sync on sign-in, on local changes, and when the app comes back. */
export function startAutoSync(): () => void {
  const sb = supabase();
  if (!sb) return () => {};
  let timer: ReturnType<typeof setTimeout> | undefined;
  const { data: auth } = sb.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT" || !session) setStatus({ kind: "signed-out" });
    else if (event === "SIGNED_IN" || event === "INITIAL_SESSION") void syncNow();
  });
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
    auth.subscription.unsubscribe();
    offChange();
    document.removeEventListener("visibilitychange", onVisible);
    window.removeEventListener("online", onOnline);
  };
}

/** Email a sign-in link (and a 6-digit code, if the email template includes it). */
export async function sendSignInEmail(email: string): Promise<void> {
  const sb = supabase();
  if (!sb) throw new Error("Sync isn't set up yet.");
  const { error } = await sb.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${window.location.origin}/settings` },
  });
  if (error) throw new Error(error.message);
}

/** For the code typed from the email, when the link opens in another browser. */
export async function verifySignInCode(email: string, code: string): Promise<void> {
  const sb = supabase();
  if (!sb) throw new Error("Sync isn't set up yet.");
  const { error } = await sb.auth.verifyOtp({ email, token: code, type: "email" });
  if (error) throw new Error(error.message);
}

export async function signOut(): Promise<void> {
  await supabase()?.auth.signOut();
  setStatus({ kind: "signed-out" });
}
