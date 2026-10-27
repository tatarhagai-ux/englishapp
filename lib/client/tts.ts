"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { browserSpeechActive, markAzureMissing, speakInBrowser, stopSpeaking } from "./browser-speech";

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
  if (res.status === 503) {
    markAzureMissing();
    throw new TtsRequestError("not_configured");
  }
  if (res.status === 401) throw new TtsRequestError("unauthorized");
  if (res.status === 402) throw new TtsRequestError("budget");
  throw new TtsRequestError("provider");
}

type PlayState = { key: string; status: "loading" | "playing" } | null;

/**
 * Plays one clip at a time. Clips are cached as object URLs for the life of the page,
 * so replaying a sample costs nothing. Without Azure it uses the browser's voice instead.
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
    stopSpeaking();
    setState(null);
  }, []);

  const speakFree = useCallback(async (key: string, text: string, voiceId: string, rate: number) => {
    setState({ key, status: "playing" });
    await speakInBrowser(text, voiceId, rate);
    setState((s) => (s?.key === key ? null : s));
  }, []);

  const play = useCallback(
    async (key: string, text: string, voiceId: string, rate: number) => {
      stop();
      setError(null);
      setState({ key, status: "loading" });
      try {
        if (browserSpeechActive()) return await speakFree(key, text, voiceId, rate);
        let url = cache.current.get(key);
        if (!url) {
          const ctrl = new AbortController();
          abortRef.current = ctrl;
          try {
            url = URL.createObjectURL(await fetchSpeech(text, voiceId, rate, ctrl.signal));
          } catch (err) {
            if (err instanceof TtsRequestError && err.kind === "not_configured") {
              return await speakFree(key, text, voiceId, rate);
            }
            throw err;
          }
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
    [stop, speakFree],
  );

  return { play, stop, state, error };
}

/**
 * Play lines one after another, each in its own voice (listening stories). Resolves when the
 * last line ends or the signal aborts. Without Azure it uses the browser's voices.
 */
export async function speakSequence(
  lines: { text: string; voiceId: string }[],
  rate: number,
  opts: { signal?: AbortSignal; onLine?: (index: number) => void } = {},
): Promise<void> {
  const { signal } = opts;
  let audio: HTMLAudioElement | null = null;
  // Stopping must silence whatever is speaking right now, the device voice included.
  const onAbort = () => {
    audio?.pause();
    stopSpeaking();
  };
  signal?.addEventListener("abort", onAbort, { once: true });
  try {
    for (let i = 0; i < lines.length; i++) {
      if (signal?.aborted) return;
      opts.onLine?.(i);
      const { text, voiceId } = lines[i];
      if (!browserSpeechActive()) {
        let blob: Blob | null = null;
        try {
          blob = await fetchSpeech(text, voiceId, rate, signal);
        } catch (err) {
          if (signal?.aborted || !(err instanceof TtsRequestError)) return;
          // Any Azure problem (not set up, offline, over budget): the device voice still works.
        }
        if (signal?.aborted) return;
        if (blob) {
          const url = URL.createObjectURL(blob);
          await new Promise<void>((resolve) => {
            const el = new Audio(url);
            audio = el;
            const done = () => {
              URL.revokeObjectURL(url);
              signal?.removeEventListener("abort", done);
              resolve();
            };
            el.onended = done;
            el.onerror = done;
            signal?.addEventListener("abort", done, { once: true });
            el.play().catch(done);
          });
          audio = null;
          continue;
        }
      }
      await speakInBrowser(text, voiceId, rate);
    }
  } finally {
    signal?.removeEventListener("abort", onAbort);
  }
}
