"use client";

import { useCallback, useSyncExternalStore } from "react";
import { DEFAULT_TUTOR_VOICE_ID } from "@/content/voices";

/**
 * Per-device preferences. They live in localStorage until the Supabase profile exists,
 * then sync there. Reads are wrapped because storage can throw in private mode.
 */
export interface Prefs {
  tutorVoiceId: string;
  /** True once Hagai has actively picked a tutor voice. */
  tutorChosen: boolean;
  speechRate: number;
  dailyGoalMinutes: number;
  /** How much the tutor corrects during the conversation (the report always has fixes). */
  correctionMode: "off" | "gentle" | "precise";
  /** Show Hebrew translations next to explanations by default. Off keeps it challenging. */
  hebrewHelp: boolean;
  sessionMinutes: number;
  /**
   * "tap": tap to start, talk as long as you like, tap to stop, check the text, then send.
   * "handsfree": the turn goes out by itself after a short silence.
   */
  micMode: "tap" | "handsfree";
  /** "system" follows the phone's light or dark setting. */
  theme: "dark" | "light" | "system";
}

const KEY = "sw_prefs_v1";
const DEFAULTS: Prefs = {
  tutorVoiceId: DEFAULT_TUTOR_VOICE_ID,
  tutorChosen: false,
  speechRate: 1,
  dailyGoalMinutes: 12,
  correctionMode: "gentle",
  hebrewHelp: false,
  sessionMinutes: 10,
  micMode: "tap",
  theme: "dark",
};

const listeners = new Set<() => void>();
let snapshot: Prefs | null = null;

function load(): Prefs {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Prefs>) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

function getSnapshot(): Prefs {
  snapshot ??= load();
  return snapshot;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      snapshot = load();
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function usePrefs(): [Prefs, (patch: Partial<Prefs>) => void] {
  const prefs = useSyncExternalStore(subscribe, getSnapshot, () => DEFAULTS);
  const update = useCallback((patch: Partial<Prefs>) => {
    snapshot = { ...getSnapshot(), ...patch };
    try {
      window.localStorage.setItem(KEY, JSON.stringify(snapshot));
    } catch {
      // Storage unavailable: keep the in-memory value for this visit.
    }
    listeners.forEach((l) => l());
  }, []);
  return [prefs, update];
}
