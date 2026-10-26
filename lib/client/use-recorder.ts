"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Long enough for any practice sentence; stops by itself so the mic never stays open. */
export const RECORD_MAX_MS = 12_000;

export function canRecord(): boolean {
  return typeof window !== "undefined" && "MediaRecorder" in window && !!navigator.mediaDevices?.getUserMedia;
}

/**
 * "Hear yourself": record a sentence, then play it back next to the tutor's version. Plain
 * audio, kept in memory for this page only, never uploaded or stored. Separate from speech
 * recognition, which can't share the microphone on Android.
 */
export function useRecorder() {
  const [recordingKey, setRecordingKey] = useState<string | null>(null);
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const [clips, setClips] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const clipsRef = useRef(clips);
  clipsRef.current = clips;

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      recorderRef.current?.stop();
      audioRef.current?.pause();
      Object.values(clipsRef.current).forEach((u) => URL.revokeObjectURL(u));
    },
    [],
  );

  const stop = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }, []);

  const record = useCallback(
    async (key: string) => {
      if (recorderRef.current?.state === "recording") return stop();
      audioRef.current?.pause();
      setPlayingKey(null);
      setError(null);
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        setError("The microphone is blocked. Allow it in the browser settings.");
        return;
      }
      const rec = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        recorderRef.current = null;
        setRecordingKey(null);
        if (!chunks.length) return;
        const url = URL.createObjectURL(new Blob(chunks, { type: rec.mimeType || "audio/webm" }));
        setClips((c) => {
          if (c[key]) URL.revokeObjectURL(c[key]);
          return { ...c, [key]: url };
        });
      };
      recorderRef.current = rec;
      rec.start();
      setRecordingKey(key);
      timerRef.current = setTimeout(stop, RECORD_MAX_MS);
    },
    [stop],
  );

  const play = useCallback(
    (key: string) => {
      const url = clipsRef.current[key];
      if (!url) return;
      audioRef.current ??= new Audio();
      const audio = audioRef.current;
      if (!audio.paused && playingKey === key) {
        audio.pause();
        setPlayingKey(null);
        return;
      }
      audio.src = url;
      audio.onended = () => setPlayingKey(null);
      setPlayingKey(key);
      audio.play().catch(() => setPlayingKey(null));
    },
    [playingKey],
  );

  return { record, stop, play, recordingKey, playingKey, clips, error };
}
