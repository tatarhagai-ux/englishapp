"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Check, ChevronDown, Info } from "lucide-react";
import clsx from "clsx";
import { scenarioById } from "@/content/scenarios";
import { useLearner } from "@/lib/client/learner";
import { ownedStretchWords, planPosition, weekToReplay, wordUses, WORD_OWNED_USES } from "@/lib/learner/plan";
import { speakingChecks } from "@/lib/learner/weekly";
import { PLAN } from "@/content/plan";
import { dayKey } from "@/lib/game/streak";

/**
 * Home's main card: where he is in the 12-week plan and the one thing to do today.
 * Finished today's day? He can keep going; a missed day just waits.
 */
export function PlanToday({ ready, minutesToday, goal }: { ready: boolean; minutesToday: number; goal: number }) {
  const state = useLearner();
  const pos = planPosition(state, dayKey(new Date()));
  const [howOpen, setHowOpen] = useState(false);
  const next = pos.next;
  const scenario = next ? scenarioById(next.scenarioId) : undefined;
  const href = !ready ? "/setup" : next ? `/session/${next.scenarioId}?plan=${next.key}` : "/practice";
  const doneToday = pos.doneToday > 0;

  return (
    <section aria-labelledby="today-title" className="space-y-3">
      <div className="rounded-3xl bg-accent p-5 text-white" style={{ boxShadow: "0 6px 0 var(--accent-deep)" }}>
        <p className="text-xs font-extrabold uppercase tracking-wider">
          {next ? `Week ${pos.week.week} of 12 · ${pos.week.title}` : "12-week plan complete"}
        </p>
        <h2 id="today-title" className="mt-1 text-2xl font-black leading-tight">
          {doneToday && next ? "Today's done. Keep going?" : (scenario?.title ?? "You finished the plan")}
        </h2>
        <p className="mt-1 font-bold">
          {next
            ? `${doneToday ? "Next: " : ""}Day ${next.day} of 5${next.check ? " · speaking check" : ""} · ${
                scenario?.minutes ?? 10
              } min${doneToday ? ` · ${scenario?.title}` : ""}`
            : "Pick anything from Practice, or run the plan again for a fresh look at your progress."}
        </p>

        <ol className="mt-4 flex gap-2" aria-label="This week">
          {pos.weekDone.map((d, i) => {
            const current = next?.week === pos.week.week && next.day === i + 1;
            return (
              <li
                key={i}
                aria-label={`Day ${i + 1}${d ? ", done" : current ? ", next" : ""}`}
                className={clsx(
                  "grid size-8 place-items-center rounded-full text-sm font-black",
                  d ? "bg-xp text-[#3a2a00]" : current ? "bg-white text-accent-deep" : "bg-white/20",
                )}
              >
                {d ? <Check className="size-4" strokeWidth={3} aria-hidden /> : i + 1}
              </li>
            );
          })}
        </ol>

        <p className="mt-3 rounded-xl bg-black/20 px-3 py-2 text-sm font-bold">
          <span>This week&apos;s focus: </span>
          {pos.week.focus}
        </p>

        <div
          className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/25"
          role="progressbar"
          aria-label="Minutes spoken today"
          aria-valuemin={0}
          aria-valuemax={goal}
          aria-valuenow={minutesToday}
        >
          <div className="h-full rounded-full bg-xp" style={{ width: `${Math.min(1, minutesToday / goal) * 100}%` }} />
        </div>
        <p className="mt-1 text-xs font-extrabold">
          {minutesToday} of {goal} minutes today · {pos.done} of {pos.total} plan days done
        </p>
      </div>

      <Link
        href={href}
        className={clsx(
          "btn-3d flex w-full items-center justify-center gap-2 py-4 text-lg uppercase",
          doneToday ? "btn-ghost" : "btn-go",
        )}
      >
        {!ready ? "Finish setup" : !next ? "Practice" : doneToday ? "Keep going" : "Start today"}
        <ArrowRight className="size-5" aria-hidden />
      </Link>

      {!next && ready && <PlanComplete />}

      <WeekWords />

      <div>
        <button
          type="button"
          onClick={() => setHowOpen((v) => !v)}
          aria-expanded={howOpen}
          className="flex items-center gap-1.5 text-sm font-extrabold text-accent"
        >
          <Info className="size-4" aria-hidden /> How the plan works
          <ChevronDown className={clsx("size-4 transition-transform", howOpen && "rotate-180")} aria-hidden />
        </button>
        {howOpen && (
          <ul className="mt-2 space-y-1.5 rounded-2xl bg-elev-2 p-3 text-sm text-dim">
            <li>12 weeks, 5 days a week, about 12 minutes a day.</li>
            <li>Each day: a short warm-up on your past mistakes, one conversation, then a report with your fixes.</li>
            <li>Each week has one focus and 8 new words. Your tutor gives you chances to use them.</li>
            <li>Have more time? Keep going to the next day. Missed a day? It waits for you.</li>
            <li>Weeks 4, 8 and 12 end with the same speaking check, so you can see how far you&apos;ve come.</li>
          </ul>
        )}
      </div>
    </section>
  );
}

/** The week's 8 stretch words: tap one for its meaning; a tick once it's used twice. */
function WeekWords() {
  const state = useLearner();
  const pos = planPosition(state, dayKey(new Date()));
  const [open, setOpen] = useState<string | null>(null);
  const words = pos.week.words;
  const owned = words.filter((w) => wordUses(state, w) >= WORD_OWNED_USES).length;
  const shown = words.find((w) => w.text === open);

  return (
    <section aria-labelledby="words-title" className="tile space-y-3 p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="words-title" className="font-black">
          Words of the week
        </h2>
        <span className="text-xs font-extrabold text-faint">
          {owned} of {words.length} yours
        </span>
      </div>
      <p className="text-sm text-dim">
        A step above everyday English. Use each one twice in a conversation and it&apos;s yours.
      </p>
      <ul className="flex flex-wrap gap-2">
        {words.map((w) => {
          const mine = wordUses(state, w) >= WORD_OWNED_USES;
          return (
            <li key={w.text}>
              <button
                type="button"
                onClick={() => setOpen(open === w.text ? null : w.text)}
                aria-pressed={open === w.text}
                className={clsx(
                  "flex items-center gap-1 rounded-xl border-2 px-2.5 py-1.5 text-sm font-extrabold",
                  mine ? "border-good/50 text-good" : "border-line bg-elev-2",
                  open === w.text && "border-accent",
                )}
              >
                {mine && <Check className="size-3.5" strokeWidth={3} aria-hidden />}
                {w.text}
              </button>
            </li>
          );
        })}
      </ul>
      {shown && (
        <div className="rounded-xl bg-elev-2 p-3 text-sm" aria-live="polite">
          <p className="font-extrabold">{shown.text}</p>
          <p className="text-dim">{shown.meaningEn}</p>
          <p dir="rtl" lang="he" className="text-dim">
            {shown.meaningHe}
          </p>
          <p className="mt-1 italic">“{shown.example}”</p>
        </div>
      )}
    </section>
  );
}

/** The plan is done: what changed, and a clear way to keep going. */
function PlanComplete() {
  const state = useLearner();
  const checks = speakingChecks(state).filter((c) => c.cefr);
  const first = checks[0];
  const last = checks.at(-1);
  const owned = ownedStretchWords(state);
  const total = PLAN.reduce((n, w) => n + w.words.length, 0);
  const replay = weekToReplay(state);
  const day1 = replay.days[0];
  return (
    <section aria-labelledby="done-title" className="tile space-y-3 p-4">
      <h2 id="done-title" className="font-black">
        What changed in 12 weeks
      </h2>
      <dl className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-elev-2 p-3">
          <dt className="text-xs font-bold text-dim">Speaking level</dt>
          <dd className="text-xl font-black">
            {first && last && first !== last ? `${first.cefr} → ${last.cefr}` : (last?.cefr ?? "—")}
          </dd>
        </div>
        <div className="rounded-xl bg-elev-2 p-3">
          <dt className="text-xs font-bold text-dim">Words you own</dt>
          <dd className="text-xl font-black">
            {owned}/{total}
          </dd>
        </div>
      </dl>
      <Link
        href={`/session/${day1.scenarioId}?plan=${day1.key}`}
        className="btn-3d btn-accent flex w-full items-center justify-center gap-2 py-3"
      >
        Replay week {replay.week}: {replay.title} <ArrowRight className="size-4" aria-hidden />
      </Link>
      <p className="text-xs font-bold text-dim">
        The week whose words you use least. Then keep a daily habit with word cards, a story and a one-minute talk.
      </p>
    </section>
  );
}
