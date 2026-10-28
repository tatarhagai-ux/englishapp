"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Headphones, Smartphone, X } from "lucide-react";
import { usePrefs } from "@/lib/client/prefs";
import { voiceById } from "@/content/voices";
import { Avatar } from "./Avatar";

function partOfDay(hour: number) {
  if (hour < 5) return "Up late";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function Greeting() {
  // Rendered after mount so the server's timezone never decides the greeting.
  const [text, setText] = useState("Hi");
  useEffect(() => setText(partOfDay(new Date().getHours())), []);
  return <h1 className="text-xl font-black tracking-tight">{text}, Hagai</h1>;
}

export function TutorBadge() {
  const [prefs] = usePrefs();
  const voice = voiceById(prefs.tutorVoiceId);
  if (!voice) return null;
  return (
    <div className="flex items-center gap-2">
      <Avatar name={voice.displayName} size={32} />
      <div className="leading-tight">
        <p className="text-sm font-medium">{voice.displayName}</p>
        <p className="text-[11px] text-dim">{prefs.tutorChosen ? "Your tutor" : "Default tutor"}</p>
      </div>
    </div>
  );
}

/** Shown only until a tutor voice has been picked; after that it is noise. */
export function ChooseVoicePrompt() {
  const [prefs] = usePrefs();
  if (prefs.tutorChosen) return null;
  return (
    <Link href="/settings/voice" className="tile flex items-center gap-3 p-4 transition-colors hover:border-accent/60">
      <span className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent">
        <Headphones className="size-5" aria-hidden />
      </span>
      <span className="flex-1">
        <span className="block font-extrabold">Choose your tutor&apos;s voice</span>
        <span className="block text-sm text-dim">Listen to 8 voices and pick the one you like.</span>
      </span>
      <ArrowRight className="size-5 text-dim" aria-hidden />
    </Link>
  );
}

/**
 * Android only, once: the device voice sounds much better with Google's engine, and the
 * steps live in the voice settings where he wouldn't look for them.
 */
export function VoiceTipCard() {
  const [prefs, setPrefs] = usePrefs();
  const [android, setAndroid] = useState(false);
  useEffect(() => setAndroid(/Android/i.test(navigator.userAgent)), []);
  if (!android || prefs.voiceTipSeen) return null;
  return (
    <div className="tile flex items-center gap-3 p-4">
      <Link
        href="/settings/voice#voice-tip"
        onClick={() => setPrefs({ voiceTipSeen: true })}
        className="flex flex-1 items-center gap-3"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
          <Smartphone className="size-5" aria-hidden />
        </span>
        <span className="flex-1">
          <span className="block font-extrabold">Make the voices sound natural</span>
          <span className="block text-sm text-dim">A 2-minute change in your phone&apos;s settings.</span>
        </span>
      </Link>
      <button
        type="button"
        onClick={() => setPrefs({ voiceTipSeen: true })}
        aria-label="Dismiss the voice tip"
        className="tap rounded-full p-1.5 text-faint hover:text-text"
      >
        <X className="size-4" aria-hidden />
      </button>
    </div>
  );
}
