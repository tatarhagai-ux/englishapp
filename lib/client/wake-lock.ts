"use client";

import { useEffect } from "react";

/**
 * Keeps the screen on while `active`. A phone screen that dims after 30 seconds without a
 * touch also stops the microphone and the tutor's voice in most browsers, which cut
 * conversations off mid-sentence. The browser drops the lock whenever the app goes to the
 * background, so it is asked for again on return. Silently does nothing where unsupported.
 */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || typeof navigator === "undefined" || typeof document === "undefined") return;
    return keepScreenOn(navigator, document);
  }, [active]);
}

type WakeLockNavigator = Pick<Navigator, "wakeLock"> | object;
type VisibilityDocument = Pick<Document, "visibilityState" | "addEventListener" | "removeEventListener">;

/** Holds a screen wake lock until the returned function is called. */
export function keepScreenOn(nav: WakeLockNavigator, doc: VisibilityDocument): () => void {
  if (!("wakeLock" in nav) || !nav.wakeLock) return () => {};
  const wakeLock = nav.wakeLock;
  let sentinel: WakeLockSentinel | null = null;
  let pending = false;
  let cancelled = false;

  async function request() {
    if (cancelled || pending || doc.visibilityState !== "visible" || (sentinel && !sentinel.released)) return;
    pending = true;
    try {
      const lock = await wakeLock.request("screen");
      if (cancelled) void lock.release().catch(() => {});
      else sentinel = lock;
    } catch {
      // Battery saver or a denied permission: the screen just follows its normal timeout.
    } finally {
      pending = false;
    }
  }

  const onVisible = () => void request();
  void request();
  doc.addEventListener("visibilitychange", onVisible);
  return () => {
    cancelled = true;
    doc.removeEventListener("visibilitychange", onVisible);
    void sentinel?.release().catch(() => {});
  };
}
