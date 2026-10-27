"use client";

import Link from "next/link";
import { Fragment, useEffect, useRef, useState } from "react";
import { BookOpen, Check, ChevronLeft, Plus, Square, Volume2, X } from "lucide-react";
import clsx from "clsx";
import { READINGS, type Reading, type ReadingGloss } from "@/content/readings";
import { learner, useHydrated, useLearner } from "@/lib/client/learner";
import { usePrefs } from "@/lib/client/prefs";
import { speakSequence, useClipPlayer } from "@/lib/client/tts";
import { primeAudio } from "@/lib/client/speech";
import { HowItWorks } from "@/components/HowItWorks";
import { KeepGoing } from "@/components/KeepGoing";
import { QuizQuestion } from "@/components/QuizQuestion";

/** The list of short reads, with his best score on each. */
export function ReadingList() {
  const hydrated = useHydrated();
  const state = useLearner();
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
          <h1 className="text-2xl font-black tracking-tight">Short reads</h1>
          <p className="text-sm text-dim">Two minutes each, on things you care about. Tap a marked phrase for help.</p>
          <HowItWorks
            steps={[
              "Read it through once, or listen while you read.",
              "Tap an underlined phrase for its meaning and Hebrew; save the ones you want to use.",
              "Two questions at the end check you got it.",
            ]}
            why="Reading natural English with help on tap grows your vocabulary fast, and saved phrases come back in your conversations."
          />
        </div>
      </header>
      <ul className="space-y-2.5">
        {READINGS.map((r) => {
          const best = hydrated ? state.readings?.[r.id]?.best : undefined;
          return (
            <li key={r.id}>
              <Link
                href={`/read/${r.id}`}
                className="tile flex items-center gap-3 p-4 transition-colors hover:border-accent/60"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
                  <BookOpen className="size-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-extrabold">{r.title}</span>
                  <span className="block text-xs font-bold text-dim">
                    {r.level} · {r.minutes} min · {r.glossary.length} phrases
                  </span>
                </span>
                <span
                  className={clsx(
                    "text-xs font-black",
                    best === undefined ? "text-faint" : best === r.questions.length ? "text-good" : "text-warn",
                  )}
                >
                  {best === undefined ? "New" : `${best}/${r.questions.length}`}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Splits a paragraph so each glossary phrase's first appearance becomes a tappable part. */
function parts(paragraph: string, glossary: ReadingGloss[], used: Set<string>) {
  const out: (string | ReadingGloss)[] = [];
  let rest = paragraph;
  while (rest) {
    let hit: { g: ReadingGloss; at: number } | null = null;
    for (const g of glossary) {
      if (used.has(g.text)) continue;
      const at = rest.indexOf(g.text);
      if (at >= 0 && (!hit || at < hit.at)) hit = { g, at };
    }
    if (!hit) {
      out.push(rest);
      break;
    }
    if (hit.at > 0) out.push(rest.slice(0, hit.at));
    out.push(hit.g);
    used.add(hit.g.text);
    rest = rest.slice(hit.at + hit.g.text.length);
  }
  return out;
}

function sentenceWith(reading: Reading, phrase: string): string | undefined {
  for (const p of reading.paragraphs) {
    const s = p.split(/(?<=[.!?])\s+/).find((x) => x.includes(phrase));
    if (s) return s;
  }
  return undefined;
}

export function Reader({ reading }: { reading: Reading }) {
  const state = useLearner();
  const [prefs] = usePrefs();
  const player = useClipPlayer();
  const [open, setOpen] = useState<ReadingGloss | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>(reading.questions.map(() => null));
  const [reading_, setReading] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => () => abortRef.current?.abort(), []);

  const saved = new Set(state.phrases.map((p) => p.text.toLowerCase()));
  const used = new Set<string>();
  const correct = answers.filter((a, i) => a === reading.questions[i].answer).length;
  const allAnswered = answers.every((a) => a !== null);

  async function readAloud() {
    if (reading_ !== null) {
      abortRef.current?.abort();
      setReading(null);
      return;
    }
    primeAudio();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setReading(0);
    try {
      await speakSequence(
        reading.paragraphs.map((text) => ({ text, voiceId: prefs.tutorVoiceId })),
        0.95 * prefs.speechRate,
        { signal: ctrl.signal, onLine: (i) => setReading(i) },
      );
    } catch {
      // Stop quietly; the text is still there to read.
    } finally {
      if (abortRef.current === ctrl) setReading(null);
    }
  }

  function save(g: ReadingGloss) {
    learner.addPhrases(
      [{ text: g.text, meaningEn: g.meaningEn, meaningHe: g.meaningHe, example: sentenceWith(reading, g.text) }],
      "Reading",
    );
  }

  function answer(qi: number, oi: number) {
    if (answers[qi] !== null) return;
    const next = answers.map((a, i) => (i === qi ? oi : a));
    setAnswers(next);
    if (next.every((a) => a !== null)) {
      learner.recordReading(reading.id, next.filter((a, i) => a === reading.questions[i].answer).length);
    }
  }

  return (
    <div className="space-y-5 pb-24">
      <header className="flex items-start gap-2">
        <Link href="/read" aria-label="Back to short reads" className="-ml-2 rounded-full p-2 text-dim hover:text-text">
          <ChevronLeft className="size-5" />
        </Link>
        <div className="flex-1">
          <p className="text-xs font-extrabold uppercase tracking-wider text-faint">
            Short read · {reading.level} · {reading.minutes} min
          </p>
          <h1 className="text-2xl font-black leading-tight">{reading.title}</h1>
        </div>
        <button
          type="button"
          onClick={() => void readAloud()}
          aria-label={reading_ !== null ? "Stop reading aloud" : "Listen while you read"}
          className="grid size-11 shrink-0 place-items-center rounded-full bg-elev-2 hover:bg-accent hover:text-white"
        >
          {reading_ !== null ? <Square className="size-4 fill-current" /> : <Volume2 className="size-5" />}
        </button>
      </header>

      <article className="space-y-4 text-[17px] leading-relaxed">
        {reading.paragraphs.map((p, i) => (
          <p key={i} className={clsx("rounded-xl transition-colors", reading_ === i && "bg-accent-soft")}>
            {parts(p, reading.glossary, used).map((part, j) =>
              typeof part === "string" ? (
                <Fragment key={j}>{part}</Fragment>
              ) : (
                <button
                  key={j}
                  type="button"
                  onClick={() => setOpen(part)}
                  className={clsx(
                    "rounded px-0.5 font-bold underline decoration-dotted decoration-2 underline-offset-4",
                    saved.has(part.text.toLowerCase()) ? "text-good decoration-go" : "text-accent decoration-accent",
                  )}
                >
                  {part.text}
                </button>
              ),
            )}
          </p>
        ))}
      </article>

      <section aria-labelledby="rq-title" className="space-y-3">
        <h2 id="rq-title" className="font-black">
          Did you get it?
        </h2>
        {reading.questions.map((q, qi) => (
          <QuizQuestion
            key={q.q}
            number={qi + 1}
            q={q.q}
            options={q.options}
            answer={q.answer}
            picked={answers[qi]}
            onPick={(oi) => answer(qi, oi)}
          />
        ))}
        {allAnswered && (
          <p role="status" className="font-extrabold text-good">
            {correct}/{reading.questions.length} right.
          </p>
        )}
      </section>

      {allAnswered && <KeepGoing next={null} avoid={[]} />}

      {open && (
        <div
          role="dialog"
          aria-label={open.text}
          className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-xl space-y-2 rounded-t-3xl border-2 border-line bg-elev p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] shadow-2xl"
        >
          <div className="flex items-center gap-3">
            <p className="flex-1 text-xl font-black">{open.text}</p>
            <button
              type="button"
              onClick={() => void player.play(`read:${open.text}`, open.text, prefs.tutorVoiceId, 0.95)}
              aria-label={`Hear "${open.text}"`}
              className="grid size-10 place-items-center rounded-full bg-elev-2 hover:bg-accent hover:text-white"
            >
              <Volume2 className="size-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => setOpen(null)}
              aria-label="Close"
              className="grid size-10 place-items-center rounded-full text-dim hover:text-text"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
          <p className="font-bold text-dim">{open.meaningEn}</p>
          <p dir="rtl" lang="he">
            {open.meaningHe}
          </p>
          <button
            type="button"
            onClick={() => save(open)}
            disabled={saved.has(open.text.toLowerCase())}
            className="btn-3d btn-accent flex w-full items-center justify-center gap-1.5 py-2.5 text-sm disabled:opacity-70"
          >
            {saved.has(open.text.toLowerCase()) ? (
              <>
                <Check className="size-4" aria-hidden /> In your word cards
              </>
            ) : (
              <>
                <Plus className="size-4" aria-hidden /> Save to word cards
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
