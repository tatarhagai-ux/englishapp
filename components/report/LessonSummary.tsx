"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Check, ClipboardList, Flame, MessageSquareQuote, NotebookPen, Plus, Sparkles } from "lucide-react";
import clsx from "clsx";
import { learner, useLearner } from "@/lib/client/learner";
import { challengeById } from "@/content/challenges";
import { totalScore, type Analysis } from "@/lib/prompts/analyzer";
import type { StepLink } from "@/lib/learner/steps";

const PARTS = [
  { key: "fluency", label: "Flow" },
  { key: "accuracy", label: "Accuracy" },
  { key: "range", label: "Range" },
  { key: "task", label: "Task" },
] as const;

/**
 * The teacher's wrap-up at the top of the report: a score, how it felt, what to do now,
 * and one piece of homework the tutor asks about next time.
 */
export function LessonSummary({
  report,
  steps,
  sessionId,
  homeworkDone,
  previousScore,
  hebrewHelp,
  demo,
  challengeId,
}: {
  report: Analysis;
  steps: StepLink[];
  sessionId: string;
  homeworkDone: boolean;
  previousScore: number | null;
  hebrewHelp: boolean;
  demo: boolean;
  challengeId?: string;
}) {
  const score = report.score;
  const total = score ? totalScore(score) : null;
  const delta = total !== null && previousScore !== null ? total - previousScore : null;
  const challenge = challengeById(challengeId);
  const upgrades = report.upgrades ?? [];
  if (!score && !report.felt_en && !steps.length && !report.homework && !upgrades.length) return null;

  return (
    <section aria-labelledby="summary-title" className="tile space-y-4 p-5">
      <h2 id="summary-title" className="flex items-center gap-2 font-black">
        <ClipboardList className="size-5 text-accent" aria-hidden /> Lesson summary
      </h2>

      {score && total !== null && (
        <div className="flex items-center gap-4">
          <div
            className="grid size-20 shrink-0 place-items-center rounded-3xl bg-accent text-white"
            aria-label={`Score ${total} out of 100`}
          >
            <span className="text-3xl font-black leading-none">{total}</span>
          </div>
          <div className="min-w-0 flex-1 space-y-1.5">
            {PARTS.map((p) => (
              <div key={p.key} className="flex items-center gap-2 text-xs font-bold">
                <span className="w-16 shrink-0 text-dim">{p.label}</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-elev-2" aria-hidden>
                  <span className="block h-full rounded-full bg-accent" style={{ width: `${score[p.key]}%` }} />
                </span>
                <span className="w-7 text-right">{score[p.key]}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {score && (
        <p className="-mt-1 text-sm text-dim">
          {delta !== null && (
            <span className={clsx("font-extrabold", delta >= 0 ? "text-good" : "text-bad")}>
              {delta >= 0 ? `+${delta}` : delta} since last time.{" "}
            </span>
          )}
          {score.note_en}
        </p>
      )}

      {challenge && report.challenge && (
        <p className={clsx("flex gap-2 rounded-2xl p-3 text-sm", report.challenge.met ? "bg-go/15" : "bg-warn/15")}>
          <Flame
            className={clsx("mt-0.5 size-4 shrink-0", report.challenge.met ? "text-good" : "text-xp")}
            aria-hidden
          />
          <span>
            <span className="font-extrabold">
              {challenge.title}: {report.challenge.met ? "challenge met." : "not yet."}{" "}
            </span>
            {report.challenge.note_en}
          </span>
        </p>
      )}

      {report.felt_en && (
        <div className="rounded-2xl bg-elev-2 p-3">
          <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-faint">
            <MessageSquareQuote className="size-4" aria-hidden /> How it felt to your tutor
          </p>
          <p className="mt-1 text-sm">{report.felt_en}</p>
          {hebrewHelp && report.felt_he && (
            <p dir="rtl" lang="he" className="mt-1 text-sm text-dim">
              {report.felt_he}
            </p>
          )}
        </div>
      )}

      {steps.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-extrabold uppercase tracking-wider text-faint">Do this now</p>
          <ol className="space-y-2">
            {steps.map((s, i) => (
              <li key={s.href}>
                <Link
                  href={s.href}
                  className="flex items-center gap-3 rounded-2xl border-2 border-line p-3 hover:border-accent"
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-accent text-sm font-black text-white">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-extrabold">{s.label}</span>
                    {s.why && <span className="block text-sm text-dim">{s.why}</span>}
                    {hebrewHelp && s.whyHe && (
                      <span dir="rtl" lang="he" className="block text-sm text-dim">
                        {s.whyHe}
                      </span>
                    )}
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-accent" aria-hidden />
                </Link>
              </li>
            ))}
          </ol>
        </div>
      )}

      {upgrades.length > 0 && <Upgrades items={upgrades} hebrewHelp={hebrewHelp} demo={demo} />}

      {report.homework && (
        <div className="rounded-2xl border-2 border-xp/60 bg-xp/10 p-3">
          <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-faint">
            <NotebookPen className="size-4" aria-hidden /> Homework for next time
          </p>
          <p className="mt-1 font-bold">{report.homework.task_en}</p>
          {hebrewHelp && report.homework.task_he && (
            <p dir="rtl" lang="he" className="mt-1 text-sm text-dim">
              {report.homework.task_he}
            </p>
          )}
          <p className="mt-2 text-xs text-dim">
            Your tutor will ask you to show it at the start of the next conversation.
          </p>
          {!demo &&
            (homeworkDone ? (
              <p className="mt-2 flex items-center gap-1 text-sm font-extrabold text-good">
                <Check className="size-4" aria-hidden /> Done
              </p>
            ) : (
              <button
                type="button"
                onClick={() => learner.completeHomework(sessionId)}
                className="btn-3d btn-ghost mt-2 px-4 py-2 text-sm"
              >
                Mark as done
              </button>
            ))}
        </div>
      )}
    </section>
  );
}

/** Plain words he leaned on, with a stronger one each; one tap adds them to his review. */
function Upgrades({ items, hebrewHelp, demo }: { items: Analysis["upgrades"]; hebrewHelp: boolean; demo: boolean }) {
  const state = useLearner();
  const [added, setAdded] = useState(false);
  const known = new Set(state.phrases.map((p) => p.text.toLowerCase()));
  const allIn = items.every((u) => known.has(u.better.toLowerCase()));
  return (
    <div className="space-y-2">
      <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-faint">
        <Sparkles className="size-4 text-xp" aria-hidden /> Stronger words
      </p>
      <ul className="space-y-2">
        {items.map((u) => (
          <li key={u.better} className="rounded-2xl bg-elev-2 p-3 text-sm">
            <p>
              <span className="text-dim line-through">{u.plain}</span>{" "}
              <ArrowRight className="inline size-3.5 text-accent" aria-label="instead, say" />{" "}
              <span className="font-extrabold text-good">{u.better}</span>
              {hebrewHelp && u.meaning_he && (
                <span dir="rtl" lang="he" className="text-dim">
                  {" "}
                  ({u.meaning_he})
                </span>
              )}
            </p>
            {u.example && <p className="mt-1 text-dim">“{u.example}”</p>}
          </li>
        ))}
      </ul>
      {!demo &&
        (added || allIn ? (
          <p className="flex items-center gap-1 text-sm font-extrabold text-good">
            <Check className="size-4" aria-hidden /> In your review. They&apos;ll come back in your warm-up.
          </p>
        ) : (
          <button
            type="button"
            onClick={() => {
              learner.addPhrases(
                items.map((u) => ({
                  text: u.better,
                  meaningEn: `Instead of “${u.plain}”`,
                  meaningHe: u.meaning_he,
                  example: u.example,
                })),
                "Stronger words",
              );
              setAdded(true);
            }}
            className="btn-3d btn-ghost flex items-center gap-1 px-4 py-2 text-sm"
          >
            <Plus className="size-4" aria-hidden /> Add to my review
          </button>
        ))}
    </div>
  );
}
