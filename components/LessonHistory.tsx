"use client";

import Link from "next/link";
import { ChevronRight, ClipboardList, NotebookPen, Trophy } from "lucide-react";
import clsx from "clsx";
import { scenarioById } from "@/content/scenarios";
import { useHydrated, useLearner } from "@/lib/client/learner";
import { lessonHistory } from "@/lib/learner/model";
import { totalScore } from "@/lib/prompts/analyzer";
import { dayKey, friendlyDay } from "@/lib/game/streak";

/**
 * Every finished conversation with its report: what it was about, the score, and the way
 * back into the full summary. Nothing is lost by leaving a report screen early.
 */
export function LessonHistory() {
  const hydrated = useHydrated();
  const state = useLearner();
  const today = dayKey(new Date());
  const lessons = hydrated ? lessonHistory(state) : [];

  // Grouped by day, in order.
  const days: { day: string; items: typeof lessons }[] = [];
  for (const s of lessons) {
    const last = days.at(-1);
    if (last?.day === s.day) last.items.push(s);
    else days.push({ day: s.day, items: [s] });
  }

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight">Your lessons</h1>
        <p className="text-sm text-dim">
          Every conversation and its summary: the score, your fixes, what your tutor felt, and the homework. Tap one to
          go over it again.
        </p>
      </header>

      {hydrated && lessons.length === 0 && (
        <p className="tile p-4 text-sm font-bold text-dim">
          No lessons yet. After your first conversation, its summary is kept here.
        </p>
      )}

      {days.map(({ day, items }) => (
        <section key={day} aria-label={friendlyDay(day, today)} className="space-y-2">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-faint">{friendlyDay(day, today)}</h2>
          <ul className="space-y-2">
            {items.map((s) => {
              const r = s.report;
              const score = r?.score ? totalScore(r.score) : null;
              const title = scenarioById(s.scenarioId)?.title ?? "Conversation";
              return (
                <li key={s.id}>
                  <Link
                    href={`/report/${s.id}`}
                    className="tile flex items-center gap-3 p-3.5 transition-colors hover:border-accent/60"
                  >
                    <span
                      className={clsx(
                        "grid size-11 shrink-0 place-items-center rounded-xl text-sm font-black",
                        score !== null ? "bg-accent text-white" : "bg-elev-2 text-dim",
                      )}
                      aria-label={score !== null ? `Score ${score}` : undefined}
                    >
                      {score ?? <ClipboardList className="size-5" aria-hidden />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-extrabold">{title}</span>
                      {r?.summary_en && <span className="line-clamp-2 block text-sm text-dim">{r.summary_en}</span>}
                      <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs font-bold text-faint">
                        <span>{Math.max(1, Math.round(s.speakingSeconds / 60))} min</span>
                        {r ? (
                          <>
                            <span>· {r.corrections.length} fixes</span>
                            {r.task.completed && (
                              <span className="inline-flex items-center gap-0.5 text-good">
                                · <Trophy className="size-3" aria-hidden /> mission
                              </span>
                            )}
                            {r.homework && (
                              <span className="inline-flex items-center gap-0.5">
                                · <NotebookPen className="size-3" aria-hidden /> homework
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-warn">· Report not made yet, tap to make it</span>
                        )}
                      </span>
                    </span>
                    <ChevronRight className="size-5 shrink-0 text-faint" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
