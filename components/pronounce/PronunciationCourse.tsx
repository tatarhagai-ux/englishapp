"use client";

import { HowItWorks } from "@/components/HowItWorks";
import Link from "next/link";
import { ArrowRight, ChevronLeft } from "lucide-react";
import clsx from "clsx";
import { PRONUNCIATION } from "@/content/pronunciation";
import { useHydrated, useLearner } from "@/lib/client/learner";

export function scoreTone(score: number) {
  return score >= 80 ? "text-good" : score >= 60 ? "text-warn" : "text-bad";
}

/** The course index: one card per sound or pattern, with his best score so far. */
export function PronunciationCourse() {
  const hydrated = useHydrated();
  const state = useLearner();
  const done = PRONUNCIATION.filter((u) => (state.pronunciation?.[u.id]?.best ?? 0) >= 80).length;

  return (
    <div className="space-y-5">
      <header className="flex items-center gap-2">
        <Link
          href="/practice"
          aria-label="Back to practice"
          className="-ml-2 rounded-full p-2 text-dim hover:text-text"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black tracking-tight">Pronunciation for Hebrew speakers</h1>
          <p className="text-sm text-dim">
            The sounds and patterns that most often make Israelis hard to understand. The goal is clarity, not an
            American accent.
          </p>
          <HowItWorks
            steps={[
              "Open a unit. Each one is a single sound or pattern Hebrew speakers find hard.",
              "Listen to the pairs (like west / vest) until you hear the difference.",
              "Say the sentences. Words heard right turn green; the others show what to work on.",
            ]}
            why="Being understood the first time matters more than any accent."
          />
        </div>
      </header>

      <div className="tile p-4">
        <p className="text-xs font-bold text-dim">Units at 80+</p>
        <p className="text-2xl font-black">
          {hydrated ? done : 0} / {PRONUNCIATION.length}
        </p>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-elev-2" aria-hidden>
          <div
            className="h-full rounded-full bg-go"
            style={{ width: `${((hydrated ? done : 0) / PRONUNCIATION.length) * 100}%` }}
          />
        </div>
      </div>

      <ol className="space-y-2.5">
        {PRONUNCIATION.map((u, i) => {
          const best = state.pronunciation?.[u.id]?.best;
          return (
            <li key={u.id}>
              <Link
                href={`/pronounce/${u.id}`}
                className="tile flex items-center gap-3 p-3.5 transition-colors hover:border-accent/60"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-accent-soft text-sm font-black text-accent">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-extrabold">{u.title}</span>
                  <span className="block truncate text-sm text-dim">{u.whyEn}</span>
                </span>
                {hydrated && best !== undefined ? (
                  <span className={clsx("text-lg font-black", scoreTone(best))} aria-label={`Best score ${best}`}>
                    {best}
                  </span>
                ) : (
                  <ArrowRight className="size-5 shrink-0 text-faint" aria-hidden />
                )}
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
