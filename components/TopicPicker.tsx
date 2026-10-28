"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, ChevronLeft, Shuffle, Timer } from "lucide-react";
import { TALK_TOPICS } from "@/content/topics";
import { MINUTE_TALK_ID } from "@/content/scenarios";
import { useHydrated, useLearner } from "@/lib/client/learner";
import { HowItWorks } from "@/components/HowItWorks";

/** Pick a topic card for the one-minute talk; topics he hasn't done come first. */
export function TopicPicker() {
  const hydrated = useHydrated();
  const state = useLearner();
  // Topics already talked about (the opener names the topic).
  const done = new Set(
    hydrated
      ? state.sessions
          .filter((s) => s.scenarioId === MINUTE_TALK_ID)
          .map((s) => TALK_TOPICS.find((t) => s.turns[0]?.text.includes(t.title))?.id)
          .filter((id): id is string => Boolean(id))
      : [],
  );
  const fresh = TALK_TOPICS.filter((t) => !done.has(t.id));
  const pool = fresh.length ? fresh : TALK_TOPICS;
  const [index, setIndex] = useState(0);
  const topic = pool[index % pool.length];

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
          <h1 className="text-2xl font-black tracking-tight">One-minute talk</h1>
          <p className="text-sm text-dim">One topic, three points, about a minute without stopping. Then a report.</p>
          <HowItWorks
            steps={[
              "Read the card and take a few seconds to think. Stuck for a shape? Point, reason, one example, then your point again.",
              "Tap the mic once and talk for about a minute. Pauses are fine; tap again when you're done.",
              "Your tutor asks one follow-up, then the report shows your fixes and how fluent you were.",
            ]}
            why="Short replies never make you hold the floor. Long answers are where your ideas need linking words and the whole question gets answered, which is what interviews and real conversations need."
          />
        </div>
      </header>

      <section aria-label="Your topic" className="tile space-y-3 border-accent/60 p-5">
        <p className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-faint">
          Topic card
          <span>
            {done.size > 0
              ? `${Math.min(done.size, TALK_TOPICS.length)} of ${TALK_TOPICS.length} done`
              : `${TALK_TOPICS.length} topics`}
          </span>
        </p>
        <p className="text-2xl font-black leading-snug">{topic.title}</p>
        <ol className="space-y-1.5 font-bold text-dim">
          {topic.points.map((p, i) => (
            <li key={p}>
              {i + 1}. {p}
            </li>
          ))}
        </ol>
        <button
          type="button"
          onClick={() => setIndex(index + 1)}
          className="inline-flex items-center gap-1.5 text-sm font-extrabold text-accent tap"
        >
          <Shuffle className="size-4" aria-hidden /> Another topic
        </button>
      </section>

      <Link
        href={`/session/${MINUTE_TALK_ID}?topic=${topic.id}`}
        className="btn-3d btn-go flex w-full items-center justify-center gap-2 py-4 text-lg uppercase"
      >
        <Timer className="size-5" aria-hidden /> Talk about it <ArrowRight className="size-5" aria-hidden />
      </Link>
    </div>
  );
}
