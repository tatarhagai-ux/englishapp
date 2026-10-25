"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type TtsError = "not_configured" | "unauthorized" | "budget" | "network" | "provider";

export class TtsRequestError extends Error {
  constructor(public readonly kind: TtsError) {
    super(kind);
  }
}

export async function fetchSpeech(text: string, voiceId: string, rate: number, signal?: AbortSignal): Promise<Blob> {
  const res = await fetch("/api/tts", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text, voiceId, rate }),
    signal,
  }).catch(() => {
    throw new TtsRequestError("network");
  });
  if (res.ok) return res.blob();
  if (res.status === 503) throw new TtsRequestError("not_configured");
  if (res.status === 401) throw new TtsRequestError("unauthorized");
  if (res.status === 402) throw new TtsRequestError("budget");
  throw new TtsRequestError("provider");
}

type PlayState = { key: string; status: "loading" | "playing" } | null;

/**
 * Plays one clip at a time. Clips are cached as object URLs for the life of the page,
 * so replaying a sample costs nothing.
 */
export function useClipPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cache = useRef(new Map<string, string>());
  const abortRef = useRef<AbortController | null>(null);
  const [state, setState] = useState<PlayState>(null);
  const [error, setError] = useState<TtsError | null>(null);

  useEffect(() => {
    const urls = cache.current;
    return () => {
      abortRef.current?.abort();
      audioRef.current?.pause();
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    audioRef.current?.pause();
    setState(null);
  }, []);

  const play = useCallback(
    async (key: string, text: string, voiceId: string, rate: number) => {
      stop();
      setError(null);
      setState({ key, status: "loading" });
      try {
        let url = cache.current.get(key);
        if (!url) {
          const ctrl = new AbortController();
          abortRef.current = ctrl;
          url = URL.createObjectURL(await fetchSpeech(text, voiceId, rate, ctrl.signal));
          cache.current.set(key, url);
        }
        audioRef.current ??= new Audio();
        const audio = audioRef.current;
        audio.src = url;
        audio.onended = () => setState(null);
        await audio.play();
        setState({ key, status: "playing" });
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setState(null);
        setError(err instanceof TtsRequestError ? err.kind : "provider");
      }
    },
    [stop],
  );

  return { play, stop, state, error };
}
