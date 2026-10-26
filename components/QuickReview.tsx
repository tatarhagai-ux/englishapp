"use client";

import { HowItWorks } from "@/components/HowItWorks";
import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, ChevronLeft, Keyboard, Mic } from "lucide-react";
import clsx from "clsx";
import { useHydrated, useLearner, learner } from "@/lib/client/learner";
import { usePrefs } from "@/lib/client/prefs";
import { warmupItems, type WarmupItem } from "@/lib/learner/model";
import { Warmup } from "./session/Warmup";

/** How many items a quick review covers: about two minutes. */
export const QUICK_REVIEW_MAX = 8;

/**
 * Two minutes when there's no time for a conversation: the mistakes and phrases that are
 * due, recalled out loud (or typed in quiet mode). Same spaced repetition as the warm-up.
 */
export function QuickReview() {
  const hydrated = useHydrated();
  useLearner();
  const [prefs] = usePrefs();
  const [mode, setMode] = useState<"voice" | "quiet">("voice");
  const [items, setItems] = useState<WarmupItem[] | null>(null);
  const [finished, setFinished] = useState(0);

  if (!hydrated) return <p className="text-dim">Loading…</p>;

  const due = warmupItems(learner.get(), new Date(), QUICK_REVIEW_MAX);

  if (items) {
    return (
      <Warmup
        items={items}
        mode={mode}
        sessionId={null}
        embedded
        hebrewHelp={prefs.hebrewHelp}
        onDone={() => {
          setFinished(items.length);
          setItems(null);
        }}
      />
    );
  }

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
          <h1 className="text-2xl font-black tracking-tight">Quick review</h1>
          <p className="text-sm text-dim">Two minutes, no conversation. Your mistakes and phrases that are due.</p>
          <HowItWorks
            steps={[
              "You see something you got wrong before, or a phrase you saved.",
              "Say or type the right version, then check it.",
              "Got it? It comes back later. Missed it? It comes back sooner.",
            ]}
            why="Coming back at the right time is what makes a fix stick in speech."
          />
        </div>
      </header>

      {finished > 0 && (
        <p role="status" className="tile flex items-center gap-2 p-4 font-extrabold text-good">
          <CheckCircle2 className="size-5" aria-hidden /> Done. Each one comes back right before you&apos;d forget it.
        </p>
      )}

      {due.length === 0 ? (
        <section className="tile space-y-3 p-5">
          <p className="font-extrabold">Nothing is due right now.</p>
          <p className="text-sm text-dim">
            Reviews show up here when a mistake or phrase is about to slip. A conversation adds new ones.
          </p>
          <Link href="/practice" className="btn-3d btn-go inline-block px-5 py-3 uppercase">
            Have a conversation
          </Link>
        </section>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3" role="group" aria-label="How to answer">
            {(
              [
                { m: "voice", icon: Mic, title: "Say it", detail: "Out loud" },
                { m: "quiet", icon: Keyboard, title: "Type it", detail: "Quiet mode" },
              ] as const
            ).map(({ m, icon: Icon, title, detail }) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                aria-pressed={mode === m}
                className={clsx(
                  "tile flex flex-col items-start gap-1 p-3.5 text-left",
                  mode === m ? "border-accent bg-accent-soft" : "hover:border-accent/50",
                )}
              >
                <Icon className={clsx("size-5", mode === m ? "text-accent" : "text-dim")} aria-hidden />
                <span className="font-extrabold">{title}</span>
                <span className="text-xs font-bold text-dim">{detail}</span>
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setItems(due)} className="btn-3d btn-go w-full py-4 text-lg uppercase">
            Review {due.length} {due.length === 1 ? "item" : "items"}
          </button>
        </>
      )}
    </div>
  );
}
