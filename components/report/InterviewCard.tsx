"use client";

import { useState } from "react";
import { Bookmark, BookmarkCheck, Briefcase, Check, HelpCircle, Languages, Volume2, X } from "lucide-react";
import clsx from "clsx";
import { ANSWER_PARTS, type Analysis } from "@/lib/prompts/analyzer";
import { useClipPlayer } from "@/lib/client/tts";
import { learner, useLearner } from "@/lib/client/learner";

type Interview = NonNullable<Analysis["interview"]>;

/**
 * How each interview answer was built. Hiring managers listen for a direct answer, a real
 * example, what you did yourself, and how it ended (the STAR idea, in plain words).
 */
export function InterviewCard({
  interview,
  voiceId,
  hebrewHelp = false,
}: {
  interview: Interview;
  voiceId: string;
  hebrewHelp?: boolean;
}) {
  const [explain, setExplain] = useState(false);
  const [showHe, setShowHe] = useState(hebrewHelp);
  const player = useClipPlayer();
  const state = useLearner();
  const saved = new Set(state.phrases.map((p) => p.text.toLowerCase()));
  if (!interview.answers.length) return null;
  return (
    <section aria-labelledby="interview-title" className="tile space-y-4 p-4">
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
          <Briefcase className="size-5" aria-hidden />
        </span>
        <div className="flex-1">
          <h2 id="interview-title" className="font-extrabold">
            Your interview answers
          </h2>
          {interview.note_en && <p className="text-sm text-dim">{interview.note_en}</p>}
        </div>
        <p className="text-right" aria-label={`Interview readiness ${interview.readiness} of 5`}>
          <span className="block text-2xl font-black text-accent">{interview.readiness}/5</span>
          <span className="block text-xs font-bold text-faint">ready</span>
        </p>
      </div>

      <button
        type="button"
        onClick={() => setExplain((v) => !v)}
        aria-expanded={explain}
        className="inline-flex items-center gap-1 text-sm font-extrabold text-accent tap"
      >
        <HelpCircle className="size-4" aria-hidden /> What do these four mean?
      </button>
      {explain && (
        <div className="space-y-2 rounded-xl bg-elev-2 p-3 text-sm">
          <ul className="space-y-2">
            {ANSWER_PARTS.map((p) => (
              <li key={p.key}>
                <span className="font-extrabold">{p.label}: </span>
                <span className="text-dim">{p.why}</span>
                {showHe && (
                  <p dir="rtl" lang="he" className="mt-0.5">
                    {p.whyHe}
                  </p>
                )}
              </li>
            ))}
          </ul>
          {!showHe && (
            <button
              type="button"
              onClick={() => setShowHe(true)}
              className="inline-flex items-center gap-1 font-extrabold text-accent"
            >
              <Languages className="size-4" aria-hidden /> Translate
            </button>
          )}
          <p className="text-xs text-faint">
            It&apos;s the STAR method (Situation, Task, Action, Result) in plain words.
          </p>
        </div>
      )}

      <ol className="space-y-3">
        {interview.answers.map((a, i) => (
          <li key={i} className="space-y-2 rounded-xl bg-elev-2 p-3">
            {a.question && <p className="text-sm font-extrabold">“{a.question}”</p>}
            <ul className="flex flex-wrap gap-1.5" aria-label="What the answer had">
              {ANSWER_PARTS.map((p) => (
                <li
                  key={p.key}
                  className={clsx(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-extrabold",
                    a[p.key] ? "bg-go/15 text-good" : "bg-bad/10 text-bad",
                  )}
                >
                  {a[p.key] ? <Check className="size-3.5" aria-hidden /> : <X className="size-3.5" aria-hidden />}
                  <span className="sr-only">{a[p.key] ? "Has: " : "Missing: "}</span>
                  {p.label}
                </li>
              ))}
            </ul>
            {a.tip_en && <p className="text-sm text-dim">{a.tip_en}</p>}
            {a.better_start && (
              <div className="flex items-start gap-2">
                <p className="flex-1 text-sm">
                  <span className="font-extrabold text-good">Strong start: </span>
                  {a.better_start}
                </p>
                <button
                  type="button"
                  onClick={() => void player.play(`start:${i}`, a.better_start, voiceId, 1)}
                  aria-label="Listen to the strong start"
                  className="grid size-8 shrink-0 place-items-center rounded-lg text-dim hover:text-text"
                >
                  <Volume2 className="size-4" aria-hidden />
                </button>
                {saved.has(a.better_start.toLowerCase()) ? (
                  <span
                    className="grid size-8 shrink-0 place-items-center text-good"
                    aria-label="Saved to your phrase bank"
                  >
                    <BookmarkCheck className="size-4" aria-hidden />
                  </span>
                ) : (
                  <button
                    type="button"
                    // Saved answers come back in warm-ups and quick reviews, so the opening becomes automatic.
                    onClick={() =>
                      learner.addPhrases(
                        [{ text: a.better_start, meaningEn: a.question || "Interview answer", meaningHe: "" }],
                        "Interview",
                      )
                    }
                    aria-label="Save the strong start to practice"
                    className="grid size-8 shrink-0 place-items-center rounded-lg text-dim hover:text-text"
                  >
                    <Bookmark className="size-4" aria-hidden />
                  </button>
                )}
              </div>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
