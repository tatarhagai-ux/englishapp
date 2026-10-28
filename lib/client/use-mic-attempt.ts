"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { assessPronunciation, type PronunciationResult } from "./speech";
import { learner } from "./learner";

export type MicPhase = "idle" | "opening" | "listening" | "checking";

/**
 * One "say it" attempt with honest states: "opening" until the microphone really captures,
 * then "listening" with the words heard so far, "checking" while the server writes down a
 * recorded answer, and a stop() for "I'm done". Every screen
 * with a "Say it" button uses this, so they all behave the same.
 */
export function useMicAttempt() {
  const [phase, setPhase] = useState<MicPhase>("idle");
  const [heard, setHeard] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const run = useCallback(async (reference: string): Promise<PronunciationResult> => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setHeard("");
    setPhase("opening");
    try {
      return await assessPronunciation(reference, "en-US", {
        signal: ctrl.signal,
        onListening: () => setPhase("listening"),
        onPartial: setHeard,
        onChecking: () => setPhase("checking"),
        onCost: (usd) => learner.addSpend(null, usd),
      });
    } finally {
      if (abortRef.current === ctrl) abortRef.current = null;
      setPhase("idle");
    }
  }, []);

  const stop = useCallback(() => abortRef.current?.abort(), []);

  // Opening the mic or writing an answer down: a tap would do nothing useful.
  return { phase, heard, run, stop, busy: phase !== "idle", waiting: phase === "opening" || phase === "checking" };
}
