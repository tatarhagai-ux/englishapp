"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Check, ChevronLeft, Dumbbell, Keyboard, Languages, Mic, Target, Volume2 } from "lucide-react";
import clsx from "clsx";
import { useHydrated, useLearner } from "@/lib/client/learner";
import { usePrefs } from "@/lib/client/prefs";
import { useClipPlayer } from "@/lib/client/tts";
import { mistakeSentences, type WarmupItem } from "@/lib/learner/model";
import { Warmup } from "@/components/session/Warmup";
import { saySetForMistake } from "@/content/say";
import { shuffle } from "@/lib/text/shuffle";

const DRILL_SIZE = 4;

/**
 * A mini-lesson on one of his mistakes: the rule in plain words (Hebrew on tap), wrong and
 * right side by side across several sentences, and a short drill that says them in a new
 * order. The drill is extra practice: it doesn't move the warm-up schedule.
 */
export function MistakeLesson({ mistakeKey }: { mistakeKey: string }) {
  const hydrated = useHydrated();
  const state = useLearner();
  const [prefs] = usePrefs();
  const player = useClipPlayer();
  const [showHe, setShowHe] = useState(prefs.hebrewHelp);
  const [drill, setDrill] = useState<WarmupItem[] | null>(null);
  const [mode, setMode] = useState<"voice" | "quiet">("voice");
  const [drilled, setDrilled] = useState<number | null>(null);

  if (!hydrated) return <p className="text-dim">Loading…</p>;
  const e = state.errors[mistakeKey];
  if (!e) {
    return (
      <div className="space-y-4">
        <p className="font-bold">This mistake isn&apos;t on this device.</p>
        <Link href="/progress" className="btn-3d btn-go inline-block px-5 py-3">
          Progress
        </Link>
      </div>
    );
  }
  const sentences = mistakeSentences(e);
  const saySet = saySetForMistake(e.key);
  const sayable = sentences.filter((s) => s.better && !/[=…]/.test(s.better));

  function startDrill() {
    // A new order each time, so it's the rule being practiced and not the sequence.
    const picked = shuffle(sayable).slice(0, DRILL_SIZE);
    setDrill(
      picked.map((s) => ({
        kind: "mistake",
        id: e!.key,
        target: s.better,
        wrong: s.wrong,
        why: e!.why,
        whyHe: e!.whyHe,
        ...(s.own ? {} : { practice: true }),
      })),
    );
  }

  if (drill) {
    return (
      <Warmup
        items={drill}
        mode={mode}
        sessionId={null}
        hebrewHelp={prefs.hebrewHelp}
        embedded
        schedule={false}
        label={e.title}
        onDone={(n) => {
          setDrilled(n);
          setDrill(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-5">
      <header className="flex items-start gap-2">
        <Link
          href="/progress"
          aria-label="Back to progress"
          className="-ml-2 rounded-full p-2 text-dim hover:text-text"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <div className="flex-1">
          <p className="text-xs font-extrabold uppercase tracking-wider text-faint">
            Mistake · {e.status} · seen {e.occurrences}×
          </p>
          <h1 className="text-2xl font-black leading-tight">{e.title}</h1>
        </div>
      </header>

      {drilled !== null && drilled > 0 && (
        <p role="status" className="tile flex items-center gap-2 p-4 font-extrabold text-good">
          <Check className="size-5" aria-hidden /> {drilled} done. It also comes back in your warm-ups, and the tutor
          gives you chances to use it.
        </p>
      )}

      <section className="tile space-y-2 p-4">
        <p className="font-extrabold">The rule</p>
        <p className="text-dim">{e.why}</p>
        {e.whyHe &&
          (showHe ? (
            <p dir="rtl" lang="he" className="rounded-lg bg-elev-2 px-2.5 py-1.5 text-sm">
              {e.whyHe}
            </p>
          ) : (
            <button
              type="button"
              onClick={() => setShowHe(true)}
              className="inline-flex items-center gap-1 text-sm font-extrabold text-accent"
            >
              <Languages className="size-4" aria-hidden /> Translate
            </button>
          ))}
        {e.mission && (
          <p className="flex items-center gap-1.5 pt-1 text-sm font-bold">
            <Target className="size-4 text-accent" aria-hidden /> In conversation: {e.mission}
          </p>
        )}
      </section>

      <section aria-labelledby="ex-title" className="space-y-2.5">
        <h2 id="ex-title" className="font-black">
          Wrong and right
        </h2>
        <ul className="space-y-2">
          {sentences.slice(0, 8).map((s) => (
            <li key={s.better} className="tile flex items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-bad line-through decoration-bad/60">{s.wrong}</p>
                <p className="font-bold text-good">{s.better}</p>
                {s.own && <p className="text-[11px] font-bold text-faint">You said this</p>}
              </div>
              {sayable.includes(s) && (
                <button
                  type="button"
                  onClick={() => void player.play(`mk:${s.better}`, s.better, prefs.tutorVoiceId, 0.95)}
                  aria-label={`Hear "${s.better}"`}
                  className="grid size-10 shrink-0 place-items-center rounded-full bg-elev-2 hover:bg-accent hover:text-white"
                >
                  <Volume2 className="size-4" aria-hidden />
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      {sayable.length > 0 && (
        <section className="space-y-3">
          <div className="grid grid-cols-2 gap-3" role="group" aria-label="How to answer">
            {(
              [
                { m: "voice", icon: Mic, title: "Say it" },
                { m: "quiet", icon: Keyboard, title: "Type it" },
              ] as const
            ).map(({ m, icon: Icon, title }) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                aria-pressed={mode === m}
                className={clsx(
                  "tile flex items-center gap-2 p-3 font-extrabold",
                  mode === m ? "border-accent bg-accent-soft" : "hover:border-accent/50",
                )}
              >
                <Icon className={clsx("size-5", mode === m ? "text-accent" : "text-dim")} aria-hidden /> {title}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={startDrill}
            className="btn-3d btn-go flex w-full items-center justify-center gap-2 py-4 text-lg uppercase"
          >
            <Dumbbell className="size-5" aria-hidden /> Drill {Math.min(DRILL_SIZE, sayable.length)} sentences
          </button>
        </section>
      )}

      {saySet && (
        <Link
          href={`/say/${saySet.id}`}
          className="tile flex items-center gap-3 p-4 transition-colors hover:border-accent/60"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
            <Languages className="size-5" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-extrabold">From Hebrew, out loud: {saySet.title}</span>
            <span className="block text-xs font-bold text-dim">
              Say it in English · {saySet.items.length} new sentences on the same trap
            </span>
          </span>
          <ArrowRight className="size-5 text-accent" aria-hidden />
        </Link>
      )}
    </div>
  );
}

/** All his mistakes, the ones to work on first, each opening its mini-lesson. */
export function MistakeList() {
  const hydrated = useHydrated();
  const state = useLearner();
  if (!hydrated) return <p className="text-dim">Loading…</p>;
  const open = Object.values(state.errors)
    .filter((e) => e.status !== "mastered")
    .sort((a, b) => b.occurrences - a.occurrences || b.lastSeen.localeCompare(a.lastSeen));
  const mastered = Object.values(state.errors).filter((e) => e.status === "mastered");
  return (
    <div className="space-y-5">
      <header className="flex items-start gap-2">
        <Link
          href="/practice"
          aria-label="Back to practice"
          className="-ml-2 rounded-full p-2 text-dim hover:text-text"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black tracking-tight">Your mistakes</h1>
          <p className="text-sm text-dim">
            The ones that come back most are first. Each has the rule, examples and a short drill.
          </p>
        </div>
      </header>
      <ul className="space-y-2">
        {open.map((e) => (
          <li key={e.key}>
            <Link
              href={`/mistakes/${encodeURIComponent(e.key)}`}
              className="tile flex items-center gap-3 p-3.5 transition-colors hover:border-accent/60"
            >
              <div className="min-w-0 flex-1">
                <p className="font-extrabold">{e.title}</p>
                <p className="truncate text-sm text-good">{e.better}</p>
              </div>
              <span className="shrink-0 text-xs font-bold text-dim">{e.occurrences}×</span>
            </Link>
          </li>
        ))}
      </ul>
      {mastered.length > 0 && (
        <p className="text-sm font-bold text-good">Fixed: {mastered.map((e) => e.title).join(" · ")}</p>
      )}
    </div>
  );
}
