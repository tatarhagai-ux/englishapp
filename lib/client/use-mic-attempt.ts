"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { assessPronunciation, type PronunciationResult } from "./speech";

export type MicPhase = "idle" | "opening" | "listening";

/**
 * One "say it" attempt with honest states: "opening" until the microphone really captures,
 * then "listening" with the words heard so far, and a stop() for "I'm done". Every screen
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
      });
    } finally {
      if (abortRef.current === ctrl) abortRef.current = null;
      setPhase("idle");
    }
  }, []);

  const stop = useCallback(() => abortRef.current?.abort(), []);

  return { phase, heard, run, stop, busy: phase !== "idle" };
}
