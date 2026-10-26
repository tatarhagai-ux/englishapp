"use client";

import { RefreshCw } from "lucide-react";
import { applyUpdate, useUpdate } from "@/lib/client/update";

/** A small bar when a newer version is live; one tap loads it. */
export function UpdateBanner() {
  const { available } = useUpdate();
  if (!available) return null;
  return (
    <div role="status" className="tile mb-4 flex items-center gap-3 border-accent/60 p-3">
      <RefreshCw className="size-5 shrink-0 text-accent" aria-hidden />
      <p className="flex-1 text-sm font-bold">A new version of Speakwise is ready.</p>
      <button type="button" onClick={() => void applyUpdate()} className="btn-3d btn-accent px-3 py-2 text-sm">
        Update
      </button>
    </div>
  );
}
