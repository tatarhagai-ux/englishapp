"use client";

import { useState } from "react";
import { CalendarPlus, Download } from "lucide-react";
import { usePrefs } from "@/lib/client/prefs";
import { googleCalendarUrl, reminderIcs } from "@/lib/reminder/calendar";
import { dayKey } from "@/lib/game/streak";

/**
 * Daily reminder through the calendar: no server, no push permission, and it works the
 * same on the phone and the office computer.
 */
export function ReminderSettings() {
  const [prefs] = usePrefs();
  const [time, setTime] = useState("12:30");
  const [done, setDone] = useState(false);

  const input = () => ({
    time: /^\d{2}:\d{2}$/.test(time) ? time : "12:30",
    url: window.location.origin,
    minutes: prefs.dailyGoalMinutes,
    startDay: dayKey(new Date()),
  });

  function download() {
    const blob = new Blob([reminderIcs(input())], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "speakwise-daily-reminder.ics";
    a.click();
    URL.revokeObjectURL(url);
    setDone(true);
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-dim">
        A daily event in your calendar, with a link back here. Pick a time you&apos;re usually free, like a break at the
        office.
      </p>
      <label className="flex items-center gap-3">
        <span className="font-extrabold">Time</span>
        <input
          type="time"
          value={time}
          onChange={(e) => {
            setTime(e.target.value);
            setDone(false);
          }}
          className="rounded-xl border-2 border-line bg-elev-2 px-3 py-2 font-bold outline-none focus:border-accent"
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => {
            window.open(googleCalendarUrl(input()), "_blank", "noopener");
            setDone(true);
          }}
          className="btn-3d btn-ghost flex items-center justify-center gap-2 py-2.5 text-sm"
        >
          <CalendarPlus className="size-4" aria-hidden /> Google Calendar
        </button>
        <button
          type="button"
          onClick={download}
          className="btn-3d btn-ghost flex items-center justify-center gap-2 py-2.5 text-sm"
        >
          <Download className="size-4" aria-hidden /> Other calendar
        </button>
      </div>
      {done && (
        <p role="status" className="text-sm font-bold text-good">
          Save the event in your calendar. It repeats every day at {time}.
        </p>
      )}
    </div>
  );
}
