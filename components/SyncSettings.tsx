"use client";

import Link from "next/link";
import { Cloud, CloudOff, RefreshCw } from "lucide-react";
import { syncNow, useSyncStatus } from "@/lib/client/sync";

/** Automatic: every device that opens the app with the access code shares the same progress. */
export function SyncSettings() {
  const status = useSyncStatus();

  if (status.kind === "off") {
    return (
      <div className="flex gap-3">
        <CloudOff className="mt-0.5 size-5 shrink-0 text-faint" aria-hidden />
        <p className="text-sm text-dim">
          Progress is saved on this device only. To use the same progress on your phone and computer, connect Supabase
          (free) on the{" "}
          <Link href="/setup" className="font-extrabold text-accent">
            setup page
          </Link>
          .
        </p>
      </div>
    );
  }

  const when = status.lastSyncedAt
    ? new Date(status.lastSyncedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Cloud className={`size-5 shrink-0 ${status.kind === "error" ? "text-warn" : "text-good"}`} aria-hidden />
        <p className="flex-1 text-sm">
          <span className="block font-extrabold">Backed up automatically</span>
          <span role="status" className="block text-dim">
            {status.kind === "syncing"
              ? "Syncing…"
              : status.kind === "error"
                ? status.message
                : `Up to date${when ? ` · ${when}` : ""}`}
          </span>
        </p>
      </div>
      <p className="text-sm text-dim">
        Any phone or computer where you enter the access code gets the same conversations, mistakes, phrases and
        progress. Nothing else to sign in to.
      </p>
      <button
        type="button"
        onClick={() => void syncNow()}
        disabled={status.kind === "syncing"}
        className="btn-3d btn-ghost flex w-full items-center justify-center gap-2 py-2.5 text-sm"
      >
        <RefreshCw className={`size-4 ${status.kind === "syncing" ? "animate-spin" : ""}`} aria-hidden /> Sync now
      </button>
    </div>
  );
}
