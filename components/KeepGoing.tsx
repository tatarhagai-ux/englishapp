"use client";

import Link from "next/link";
import { ArrowRight, Headphones, Languages, MessageCircle, Repeat2, Shuffle, Volume2 } from "lucide-react";
import { useLearner } from "@/lib/client/learner";
import { differentScenario, openSayMisses, warmupItems } from "@/lib/learner/model";
import { SAY_MISSES_ID, SAY_SETS } from "@/content/say";
import { QUICK_REVIEW_MAX } from "./QuickReview";

export interface NextStep {
  href: string;
  label: string;
  title: string;
  summary: string;
}

/**
 * What to do when he wants more: the natural next conversation, something different, and
 * the short skill rounds. Shown at the end of a report and on Home once today is done.
 */
export function KeepGoing({ next, avoid }: { next: NextStep | null; avoid: string[] }) {
  const state = useLearner();
  const other = differentScenario(state, [...avoid, ...(next ? [idFromHref(next.href)] : [])]);
  const due = warmupItems(state, new Date(), QUICK_REVIEW_MAX).length;
  // Sentences he missed come first; otherwise the first "Say it in English" set not done yet.
  const misses = openSayMisses(state).length;
  const saySet = SAY_SETS.find((s) => !state.sayDrills?.[s.id]);

  return (
    <section aria-labelledby="keep-going-title" className="space-y-2.5">
      <h2 id="keep-going-title" className="font-black">
        Want more?
      </h2>
      {next && (
        <Link
          href={next.href}
          className="tile flex items-center gap-3 border-accent/50 p-4 transition-colors hover:border-accent"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-white">
            <MessageCircle className="size-5" aria-hidden />
          </span>
          <span className="flex-1">
            <span className="block text-xs font-extrabold uppercase tracking-wider text-faint">{next.label}</span>
            <span className="block font-extrabold">{next.title}</span>
            <span className="block text-sm text-dim">{next.summary}</span>
          </span>
          <ArrowRight className="size-5 text-accent" aria-hidden />
        </Link>
      )}
      {other && (
        <Option
          href={`/session/${other.id}`}
          icon={Shuffle}
          title={`Something different: ${other.title}`}
          detail={`${other.minutes} min · ${other.summary}`}
        />
      )}
      <div className="grid grid-cols-2 gap-2.5">
        {due > 0 ? (
          <Option href="/review" icon={Repeat2} title="Quick review" detail={`${due} due · 2 min`} compact />
        ) : (
          <Option href="/pronounce" icon={Volume2} title="Pronunciation" detail="One sound · 3 min" compact />
        )}
        <Option href="/listen" icon={Headphones} title="Listening round" detail="Real speech · 3 min" compact />
      </div>
      {misses > 0 ? (
        <Option
          href={`/say/${SAY_MISSES_ID}`}
          icon={Languages}
          title="Say it in English: your misses"
          detail={`${misses} ${misses === 1 ? "sentence" : "sentences"} to say again · 2 min`}
        />
      ) : (
        saySet && (
          <Option
            href={`/say/${saySet.id}`}
            icon={Languages}
            title={`Say it in English: ${saySet.title}`}
            detail={`${saySet.items.length} sentences from Hebrew · 3 min`}
          />
        )
      )}
    </section>
  );
}

function idFromHref(href: string): string {
  return href.replace(/^\/session\//, "").split("?")[0];
}

function Option({
  href,
  icon: Icon,
  title,
  detail,
  compact = false,
}: {
  href: string;
  icon: typeof Shuffle;
  title: string;
  detail: string;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`tile flex items-center gap-3 transition-colors hover:border-accent/60 ${compact ? "p-3" : "p-4"}`}
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-extrabold">{title}</span>
        <span className="block truncate text-xs text-dim">{detail}</span>
      </span>
    </Link>
  );
}
