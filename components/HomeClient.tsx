"use client";

import { useEffect, useState } from "react";
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
  return <h1 className="text-2xl font-semibold tracking-tight">{text}, Hagai</h1>;
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
