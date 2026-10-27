"use client";

import Link from "next/link";
import { useEffect } from "react";
import { CheckCircle2, Headphones, Layers, MessageCircle, PartyPopper } from "lucide-react";
import clsx from "clsx";
import { learner, useLearner } from "@/lib/client/learner";
import { perfectWeekStrip } from "@/lib/learner/model";
import { dailyQuests, type Quest } from "@/lib/learner/quests";

const ICONS: Record<Quest["id"], typeof Layers> = { talk: MessageCircle, words: Layers, listen: Headphones };

/** Three small goals for today, one per skill, each a tap away. */
export function DailyQuests({ today, goal }: { today: string; goal: number }) {
  const state = useLearner();
  const quests = dailyQuests(state, today, goal);
  const finished = quests.filter((q) => q.done >= q.target).length;
  const perfect = finished === quests.length;
  const week = perfectWeekStrip(state, today);
  const perfectThisWeek = week.filter((d) => d.perfect).length;

  // Keep the day, so the week strip and the "Perfect week" badge remember it.
  useEffect(() => {
    if (perfect) learner.markPerfectDay(today);
  }, [perfect, today]);

  return (
    <section aria-labelledby="quests-title" className={clsx("tile space-y-3 p-4", perfect && "border-go")}>
      <div className="flex items-center justify-between">
        <h2 id="quests-title" className="flex items-center gap-2 font-black">
          {perfect && <PartyPopper className="size-5 text-go" aria-hidden />}
          {perfect ? "Perfect day!" : "Today's quests"}
        </h2>
        <span className="text-sm font-black text-dim">
          {finished}/{quests.length}
        </span>
      </div>
      <ul className="space-y-2.5">
        {quests.map((q) => {
          const Icon = ICONS[q.id];
          const done = q.done >= q.target;
          return (
            <li key={q.id}>
              <Link href={q.href} className="flex items-center gap-3">
                <span
                  className={clsx(
                    "grid size-9 shrink-0 place-items-center rounded-xl",
                    done ? "bg-go/15 text-go" : "bg-accent-soft text-accent",
                  )}
                >
                  {done ? <CheckCircle2 className="size-5" aria-hidden /> : <Icon className="size-5" aria-hidden />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={clsx("block text-sm font-extrabold", done && "text-dim line-through")}>
                    {q.title}
                  </span>
                  <span
                    className="mt-1 block h-2 overflow-hidden rounded-full bg-elev-2"
                    aria-label={`${q.done} of ${q.target}`}
                  >
                    <span
                      className={clsx("block h-full rounded-full", done ? "bg-go" : "bg-accent")}
                      style={{ width: `${(q.done / q.target) * 100}%` }}
                    />
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="flex items-center gap-2 border-t border-line pt-3">
        <ol className="flex gap-1.5" aria-label={`Perfect days: ${perfectThisWeek} of 7`}>
          {week.map((d) => (
            <li
              key={d.day}
              title={d.day}
              className={clsx(
                "size-6 rounded-full border-2",
                d.perfect ? "border-go bg-go" : d.day === today ? "border-accent" : "border-line",
              )}
            />
          ))}
        </ol>
        <p className="flex-1 text-right text-xs font-bold text-dim">
          {perfectThisWeek >= 5 ? "Perfect week!" : `${perfectThisWeek}/5 for a perfect week`}
        </p>
      </div>
    </section>
  );
}
