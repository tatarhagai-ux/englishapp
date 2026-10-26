"use client";

import { useState } from "react";
import { MessageCircleHeart } from "lucide-react";
import clsx from "clsx";
import { learner, useHydrated, useLearner } from "@/lib/client/learner";
import { adaptation, learningTip, type TutorLevel } from "@/lib/learner/adapt";
import { weeklySummary, weekStart } from "@/lib/learner/weekly";
import { dayKey } from "@/lib/game/streak";
import type { WeekFeeling } from "@/lib/learner/model";

const FEELINGS: { value: WeekFeeling; label: string }[] = [
  { value: "easy", label: "Too easy" },
  { value: "right", label: "About right" },
  { value: "hard", label: "Too hard" },
];

const AFTER: Record<WeekFeeling, string> = {
  easy: "Got it. Your tutor will stretch you a bit more next time.",
  right: "Good. Your tutor will keep this pace.",
  hard: "Thanks for saying so. Your tutor will slow down and keep it simpler for a while.",
};

export const LEVEL_TEXT: Record<TutorLevel, string> = {
  easier: "Simpler and a bit slower",
  steady: "Natural pace",
  stretch: "A little harder",
};

/**
 * Home's coach corner: once he has practiced 3 days in a week, a one-tap "How did this week
 * feel?"; otherwise one small tip from how he has been practicing.
 */
export function CoachCard() {
  const hydrated = useHydrated();
  const state = useLearner();
  const [answered, setAnswered] = useState<WeekFeeling | null>(null);
  if (!hydrated) return null;
  const today = dayKey(new Date());
  const week = weekStart(today);
  const asked = state.feelings?.[week];
  const askNow = !asked && weeklySummary(state, today).thisWeek.daysPracticed >= 3;
  const tip = learningTip(state);

  if (answered) {
    return (
      <section className="tile p-4 text-sm font-bold" aria-live="polite">
        {AFTER[answered]}
      </section>
    );
  }

  if (askNow) {
    return (
      <section aria-labelledby="feel-title" className="tile space-y-3 p-4">
        <h2 id="feel-title" className="flex items-center gap-2 font-black">
          <MessageCircleHeart className="size-5 text-accent" aria-hidden /> How did this week feel?
        </h2>
        <p className="text-sm text-dim">One tap. Your tutor adjusts to it.</p>
        <div className="flex gap-2">
          {FEELINGS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => {
                learner.setFeeling(week, f.value);
                setAnswered(f.value);
              }}
              className={clsx("btn-3d flex-1 px-2 py-2.5 text-sm", f.value === "right" ? "btn-accent" : "btn-ghost")}
            >
              {f.label}
            </button>
          ))}
        </div>
      </section>
    );
  }

  if (!tip) return null;
  const { level } = adaptation(state, today);
  return (
    <section aria-labelledby="tip-title" className="tile space-y-1.5 p-4">
      <p className="text-xs font-extrabold uppercase tracking-wider text-faint">Coach&apos;s tip</p>
      <h2 id="tip-title" className="font-black">
        {tip.title}
      </h2>
      <p className="text-sm text-dim">{tip.body}</p>
      <p className="pt-1 text-xs font-bold text-faint">Your tutor right now: {LEVEL_TEXT[level].toLowerCase()}.</p>
    </section>
  );
}
