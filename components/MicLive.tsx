"use client";

import { Loader2, Square } from "lucide-react";
import type { MicPhase } from "@/lib/client/use-mic-attempt";

/** Button content while a "say it" attempt runs: opening, then a live red dot and "done". */
export function MicBusyLabel({ phase }: { phase: MicPhase }) {
  if (phase === "opening" || phase === "checking") {
    return (
      <>
        <Loader2 className="size-4 animate-spin" aria-hidden />{" "}
        {phase === "opening" ? "Opening the mic…" : "Checking what you said…"}
      </>
    );
  }
  return (
    <>
      <span className="relative flex size-3" aria-hidden>
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-bad opacity-75" />
        <span className="relative inline-flex size-3 rounded-full bg-bad" />
      </span>
      Listening · tap when done
      <Square className="size-3.5" fill="currentColor" aria-hidden />
    </>
  );
}

/** The words heard so far, under the button. */
export function MicHeard({ phase, heard }: { phase: MicPhase; heard: string }) {
  if (phase !== "listening") return null;
  return (
    <p aria-live="polite" className="min-h-5 text-center text-sm font-bold text-dim">
      {heard ? `“${heard}”` : "Speak now…"}
    </p>
  );
}
