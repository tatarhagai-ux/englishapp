"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, ChevronLeft, Loader2, Play, Smartphone, Square, Wrench } from "lucide-react";
import clsx from "clsx";
import { VOICES, sampleLine, type Gender, type Voice } from "@/content/voices";
import { usePrefs } from "@/lib/client/prefs";
import { browserSpeechActive, deviceVoiceNames } from "@/lib/client/browser-speech";
import { useClipPlayer, type TtsError } from "@/lib/client/tts";
import { Avatar } from "@/components/Avatar";

const RATES = [
  { value: 0.9, label: "Slower" },
  { value: 1, label: "Natural" },
  { value: 1.1, label: "Faster" },
];

const FILTERS: { value: Gender | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
];

const ERROR_TEXT: Record<TtsError, string> = {
  not_configured: "Voices need the Azure Speech key. Finish setup first.",
  unauthorized: "Your session expired. Reload the page and unlock again.",
  budget: "This month's spending cap is reached.",
  network: "No connection. Check your internet and try again.",
  provider: "The voice service had a problem. Try again in a moment.",
};

export default function VoicePickerPage() {
  const [prefs, setPrefs] = usePrefs();
  const [filter, setFilter] = useState<Gender | "all">("all");
  const [rate, setRate] = useState(1);
  const player = useClipPlayer();

  const tutors = useMemo(
    () => VOICES.filter((v) => v.tutorCandidate && (filter === "all" || v.gender === filter)),
    [filter],
  );
  const characters = VOICES.filter((v) => !v.tutorCandidate);

  function toggle(v: Voice) {
    const key = `${v.id}:${rate}`;
    if (player.state?.key === key) player.stop();
    else void player.play(key, sampleLine(v), v.id, rate);
  }

  return (
    <div className="space-y-5">
      <header className="flex items-center gap-2">
        <Link
          href="/settings"
          aria-label="Back to settings"
          className="-ml-2 rounded-full p-2 text-dim hover:text-text"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black tracking-tight">Your tutor&apos;s voice</h1>
          <p className="text-sm text-dim">Listen to a few, then pick the one you&apos;d enjoy talking to every day.</p>
        </div>
      </header>

      {player.error && (
        <div role="alert" className="card flex items-center gap-3 border-bad/40 p-4 text-sm">
          <span className="flex-1">{ERROR_TEXT[player.error]}</span>
          {player.error === "not_configured" && (
            <Link href="/setup" className="inline-flex items-center gap-1 font-semibold text-accent">
              <Wrench className="size-4" aria-hidden /> Setup
            </Link>
          )}
        </div>
      )}

      <AndroidVoiceTip />

      {browserSpeechActive() && (
        <p role="status" className="text-sm text-dim">
          Playing your browser&apos;s closest voice. The exact voice comes once Azure is connected.
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label="Filter voices" className="flex rounded-full border border-line bg-elev p-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              aria-pressed={filter === f.value}
              className={clsx(
                "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                filter === f.value ? "bg-accent text-white" : "text-dim hover:text-text",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div role="group" aria-label="Sample speed" className="flex rounded-full border border-line bg-elev p-1">
          {RATES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setRate(r.value)}
              aria-pressed={rate === r.value}
              className={clsx(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                rate === r.value ? "bg-elev-2 text-text" : "text-faint hover:text-dim",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {tutors.map((v) => {
          const key = `${v.id}:${rate}`;
          const st = player.state?.key === key ? player.state.status : null;
          const selected = prefs.tutorVoiceId === v.id;
          return (
            <li
              key={v.id}
              className={clsx(
                "card flex flex-col gap-3 p-4 transition-colors",
                selected && "border-accent shadow-[0_0_0_1px_var(--accent)]",
              )}
            >
              <div className="flex items-center gap-3">
                <Avatar name={v.displayName} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{v.displayName}</p>
                  <p className="truncate text-xs text-dim">
                    {v.accent} · {v.vibe}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggle(v)}
                  aria-label={st === "playing" ? `Stop ${v.displayName}` : `Play ${v.displayName}`}
                  className="grid size-11 place-items-center rounded-full bg-elev-2 text-text transition-colors hover:bg-accent hover:text-white"
                >
                  {st === "loading" ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : st === "playing" ? (
                    <Square className="size-4 fill-current" />
                  ) : (
                    <Play className="size-5 translate-x-px fill-current" />
                  )}
                </button>
              </div>
              <button
                type="button"
                onClick={() => setPrefs({ tutorVoiceId: v.id, tutorChosen: true })}
                aria-pressed={selected}
                className={clsx(
                  "btn-3d inline-flex items-center justify-center gap-1.5 py-2 text-sm",
                  selected ? "btn-accent" : "btn-ghost text-dim hover:text-text",
                )}
              >
                {selected ? (
                  <>
                    <Check className="size-4" aria-hidden /> Your tutor
                  </>
                ) : (
                  "Choose"
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <section aria-labelledby="chars-title" className="space-y-3">
        <div>
          <h2 id="chars-title" className="font-semibold">
            Character voices
          </h2>
          <p className="text-sm text-dim">You&apos;ll meet these accents in roleplays. Good listening practice.</p>
        </div>
        <ul className="grid grid-cols-2 gap-3">
          {characters.map((v) => {
            const key = `${v.id}:${rate}`;
            const st = player.state?.key === key ? player.state.status : null;
            return (
              <li key={v.id}>
                <button
                  type="button"
                  onClick={() => toggle(v)}
                  className="card flex w-full items-center gap-3 p-3 text-left transition-colors hover:border-accent/60"
                >
                  <Avatar name={v.displayName} size={34} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{v.displayName}</span>
                    <span className="block text-[11px] text-dim">{v.accent}</span>
                  </span>
                  {st === "loading" ? (
                    <Loader2 className="size-4 animate-spin text-dim" aria-label="Loading" />
                  ) : st === "playing" ? (
                    <Square className="size-3.5 fill-current text-accent" aria-label="Playing" />
                  ) : (
                    <Play className="size-4 fill-current text-dim" aria-hidden />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <DeviceVoices />
    </div>
  );
}

/**
 * Without Azure the voices come from the phone itself. This shows which one each character
 * gets, so it's clear when two share a voice (pitch and pace then tell them apart).
 */
function DeviceVoices() {
  const [names, setNames] = useState<Record<string, string | null> | null>(null);
  return (
    <section aria-labelledby="device-title" className="space-y-2">
      <button
        type="button"
        id="device-title"
        aria-expanded={names !== null}
        onClick={() => (names ? setNames(null) : void deviceVoiceNames(VOICES.map((v) => v.id)).then(setNames))}
        className="text-sm font-extrabold text-accent"
      >
        {names ? "Hide" : "Show"} which voice this device uses
      </button>
      {names && (
        <ul className="space-y-1 rounded-2xl bg-elev-2 p-3 text-xs">
          {VOICES.map((v) => (
            <li key={v.id} className="flex justify-between gap-3">
              <span className="font-bold">
                {v.displayName} ({v.gender}, {v.accent})
              </span>
              <span className="truncate text-dim">{names[v.id] ?? "no English voice found"}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * Samsung phones speak with Samsung's own engine by default, which sounds flatter than
 * Google's. Chrome can only use the voice the phone's engine offers, so the biggest free
 * upgrade is in the phone's settings, not in the app.
 */
function AndroidVoiceTip() {
  const [android, setAndroid] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    setAndroid(/Android/i.test(navigator.userAgent));
    // Arriving from the Home card opens the steps right away.
    if (window.location.hash === "#voice-tip") setOpen(true);
  }, []);
  if (!android) return null;
  return (
    <section id="voice-tip" className="card scroll-mt-4 p-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 text-left"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
          <Smartphone className="size-5" aria-hidden />
        </span>
        <span className="flex-1">
          <span className="block font-extrabold">Voices sound robotic?</span>
          <span className="block text-sm text-dim">A 2-minute change on your phone makes them much more natural.</span>
        </span>
        <ChevronDown className={clsx("size-5 text-dim transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      {open && (
        <div className="mt-3 space-y-3 text-sm">
          <ol className="list-decimal space-y-1.5 pl-5">
            <li>
              Open the phone&apos;s <b>Settings</b> and search for <b>Text-to-speech</b>.
            </li>
            <li>
              Under <b>Preferred engine</b>, choose <b>Speech Recognition and Synthesis from Google</b> (or{" "}
              <b>Speech Services by Google</b>). If it&apos;s missing, install it from the Play Store.
            </li>
            <li>
              Tap the gear next to it, then <b>Install voice data</b> → <b>English (United States)</b>. Try the voices
              and pick the one you like; download it so it works offline too.
            </li>
            <li>Close Chrome completely and open the app again.</li>
          </ol>
          <p dir="rtl" lang="he" className="rounded-lg bg-elev-2 px-2.5 py-1.5">
            בעברית: הגדרות ← חיפוש &quot;המרת טקסט לדיבור&quot; ← מנוע מועדף: של Google ← גלגל השיניים ← התקנת נתוני קול
            ← אנגלית (ארה&quot;ב) ← לבחור קול ולהוריד. אחר כך לסגור את Chrome ולפתוח מחדש.
          </p>
        </div>
      )}
    </section>
  );
}
