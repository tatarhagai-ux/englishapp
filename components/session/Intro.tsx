"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Flame, Keyboard, Mic, Shuffle, Target } from "lucide-react";
import clsx from "clsx";
import type { Scenario } from "@/content/scenarios";
import { CATEGORY_INFO, characterName, scenarioLevel } from "@/content/scenarios";
import type { Voice } from "@/content/voices";
import type { TalkTopic } from "@/content/topics";
import type { Challenge } from "@/content/challenges";
import { Avatar } from "../Avatar";

interface Props {
  scenario: Scenario;
  voice: Voice;
  isTutor: boolean;
  mode: "voice" | "quiet";
  onMode: (m: "voice" | "quiet") => void;
  onStart: () => void;
  onResume?: () => void;
  blockedReason?: string | null;
  starting: boolean;
  /** Warm-up items due before this conversation (0 = straight into the conversation). */
  warmupCount: number;
  /** The one-minute talk's topic card. */
  topic?: TalkTopic;
  /** Today's challenge, with a way to pick another one. */
  challenge?: Challenge;
  onSwapChallenge?: () => void;
  hebrewHelp?: boolean;
}

/** Before the conversation: who you'll talk to, your task, and phrases worth trying. */
export function Intro({
  scenario,
  voice,
  isTutor,
  mode,
  onMode,
  onStart,
  onResume,
  blockedReason,
  starting,
  warmupCount,
  topic,
  challenge,
  onSwapChallenge,
  hebrewHelp,
}: Props) {
  const speaker = characterName(scenario) ?? voice.displayName;
  const router = useRouter();
  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col gap-5 px-4 py-6">
      <Link
        href="/"
        onClick={(e) => {
          // Back to wherever he came from (Home, Practice, a report); Home when opened directly.
          if (window.history.length > 1) {
            e.preventDefault();
            router.back();
          }
        }}
        className="-ml-2 inline-flex items-center gap-1 self-start rounded-full p-2 text-sm font-bold text-dim"
      >
        <ChevronLeft className="size-5" aria-hidden /> Back
      </Link>

      <header className="flex items-center gap-4">
        <Avatar name={speaker} size={64} />
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wider text-faint">
            {CATEGORY_INFO[scenario.category].label} · {scenario.minutes} min
            {scenarioLevel(scenario) && <> · Level {scenarioLevel(scenario)}</>}
          </p>
          <h1 className="text-2xl font-black leading-tight">{scenario.title}</h1>
          <p className="text-sm font-bold text-dim">
            {isTutor ? `With ${voice.displayName}, your tutor` : `${speaker} · ${voice.accent} accent`}
          </p>
        </div>
      </header>

      {!isTutor && scenario.role && (
        <p className="text-sm text-dim">
          <span className="font-extrabold text-text">{scenario.setting}.</span> You&apos;re talking with {scenario.role}
          .
        </p>
      )}

      {topic && (
        <section aria-label="Your topic" className="tile space-y-2 border-accent/60 p-5">
          <p className="text-xs font-extrabold uppercase tracking-wider text-faint">Your topic</p>
          <p className="text-xl font-black leading-snug">{topic.title}</p>
          <ol className="space-y-1 text-sm font-bold text-dim">
            {topic.points.map((pt, i) => (
              <li key={pt}>
                {i + 1}. {pt}
              </li>
            ))}
          </ol>
          <p className="text-xs font-bold text-faint">
            Tap the mic once, talk, tap again when you&apos;re done. Pauses are fine.
          </p>
        </section>
      )}

      <section className="rounded-3xl bg-accent p-5 text-white" style={{ boxShadow: "0 6px 0 var(--accent-deep)" }}>
        <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider">
          <Target className="size-4" aria-hidden /> Your mission
        </p>
        <p className="mt-1.5 text-lg font-extrabold leading-snug">{scenario.task}</p>
        <ul className="mt-3 space-y-1 text-sm font-bold">
          {scenario.successCriteria.map((c) => (
            <li key={c} className="flex gap-2">
              <span aria-hidden>○</span>
              {c}
            </li>
          ))}
        </ul>
      </section>

      {challenge && (
        <section aria-labelledby="challenge-title" className="tile space-y-2 border-xp/60 p-4">
          <div className="flex items-center justify-between gap-2">
            <h2
              id="challenge-title"
              className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-faint"
            >
              <Flame className="size-4 text-xp" aria-hidden /> Today&apos;s challenge · {challenge.title}
            </h2>
            {onSwapChallenge && (
              <button
                type="button"
                onClick={onSwapChallenge}
                className="tap inline-flex shrink-0 items-center gap-1 text-xs font-extrabold text-accent"
              >
                <Shuffle className="size-3.5" aria-hidden /> Another
              </button>
            )}
          </div>
          <p className="font-bold">{challenge.task}</p>
          {hebrewHelp && (
            <p dir="rtl" lang="he" className="text-sm text-dim">
              {challenge.taskHe}
            </p>
          )}
        </section>
      )}

      <section aria-labelledby="phrases-title">
        <h2 id="phrases-title" className="text-sm font-extrabold uppercase tracking-wider text-faint">
          Phrases to try
        </h2>
        <ul className="mt-2 flex flex-wrap gap-2">
          {scenario.phrases.map((p) => (
            <li key={p} className="rounded-xl border-2 border-line bg-elev px-3 py-1.5 text-sm font-bold">
              {p}
            </li>
          ))}
        </ul>
      </section>

      <div role="group" aria-label="How do you want to practice?" className="grid grid-cols-2 gap-3">
        {(
          [
            { m: "voice", icon: Mic, title: "Speak", detail: "Talk out loud" },
            { m: "quiet", icon: Keyboard, title: "Quiet mode", detail: "Type, hear the reply" },
          ] as const
        ).map(({ m, icon: Icon, title, detail }) => (
          <button
            key={m}
            type="button"
            onClick={() => onMode(m)}
            aria-pressed={mode === m}
            className={clsx(
              "tile flex flex-col items-start gap-1 p-3.5 text-left transition-colors",
              mode === m ? "border-accent bg-accent-soft" : "hover:border-accent/50",
            )}
          >
            <Icon className={clsx("size-5", mode === m ? "text-accent" : "text-dim")} aria-hidden />
            <span className="font-extrabold">{title}</span>
            <span className="text-xs font-bold text-dim">{detail}</span>
          </button>
        ))}
      </div>

      <div className="mt-auto space-y-3 pb-2">
        {blockedReason && (
          <p role="alert" className="rounded-xl bg-bad/10 p-3 text-sm font-bold text-bad">
            {blockedReason}
          </p>
        )}
        {onResume && (
          <button type="button" onClick={onResume} className="btn-3d btn-ghost w-full py-3">
            Continue where you left off
          </button>
        )}
        <button
          type="button"
          onClick={onStart}
          disabled={starting || Boolean(blockedReason)}
          className="btn-3d btn-go w-full py-4 text-lg uppercase disabled:opacity-60"
        >
          {starting ? "Starting…" : warmupCount > 0 ? `Warm up (${warmupCount}) & start` : "Start conversation"}
        </button>
      </div>
    </div>
  );
}
