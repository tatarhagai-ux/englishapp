"use client";

import { useCallback, useEffect, useState } from "react";

/** The commit this copy of the app was built from ("dev" locally). */
export const BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID ?? "dev";

export type UpdateCheck = "new" | "latest" | "error";

async function liveVersion(): Promise<string | null> {
  try {
    const res = await fetch("/api/version", { cache: "no-store" });
    if (!res.ok) return null;
    return ((await res.json()) as { version?: string }).version ?? null;
  } catch {
    return null;
  }
}

/** Load the newest version: refresh the service worker, then reload the page. */
export async function applyUpdate(): Promise<void> {
  try {
    await (await navigator.serviceWorker?.getRegistration())?.update();
  } catch {
    // The reload below still fetches the new pages.
  }
  window.location.reload();
}

/**
 * Notices when a newer version is live: on open, whenever the app comes back to the front,
 * and every 10 minutes. Nothing reloads by itself, so a conversation is never cut off.
 */
export function useUpdate() {
  const [available, setAvailable] = useState(false);

  const check = useCallback(async (): Promise<UpdateCheck> => {
    const live = await liveVersion();
    if (!live) return "error";
    const isNew = live !== "dev" && BUILD_ID !== "dev" && live !== BUILD_ID;
    setAvailable(isNew);
    return isNew ? "new" : "latest";
  }, []);

  useEffect(() => {
    void check();
    const onVisible = () => {
      if (document.visibilityState === "visible") void check();
    };
    document.addEventListener("visibilitychange", onVisible);
    const timer = setInterval(() => void check(), 10 * 60 * 1000);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(timer);
    };
  }, [check]);

  return { available, check };
}
