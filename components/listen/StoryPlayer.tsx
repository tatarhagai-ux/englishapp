"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Check, ChevronLeft, Headphones, Loader2, Play, Plus, Snail, Square, X } from "lucide-react";
import clsx from "clsx";
import type { Story } from "@/content/stories";
import { learner, useHydrated, useLearner } from "@/lib/client/learner";
import { usePrefs } from "@/lib/client/prefs";
import { speakSequence } from "@/lib/client/tts";
import { primeAudio } from "@/lib/client/speech";
import { useWakeLock } from "@/lib/client/wake-lock";
import { Avatar } from "@/components/Avatar";
import { KeepGoing } from "@/components/KeepGoing";

type Phase = "listen" | "questions" | "review";

/**
 * A listening story: hear the dialogue (text hidden, replay as often as needed, slower if
 * needed), answer three questions, then read the transcript and save the useful phrases.
 */
export function StoryPlayer({ story }: { story: Story }) {
  const hydrated = useHydrated();
  const state = useLearner();
  const [prefs] = usePrefs();
  const [phase, setPhase] = useState<Phase>("listen");
  const [playing, setPlaying] = useState<{ line: number; slow: boolean } | null>(null);
  const [plays, setPlays] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(story.questions.map(() => null));
  const [saved, setSaved] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  useWakeLock(phase === "listen");

  useEffect(() => () => abortRef.current?.abort(), []);

  const best = hydrated ? state.stories?.[story.id]?.best : undefined;
  // Each speaker gets their own color (seeds that differ in the last letter never collide).
  const speakers = [...new Set(story.lines.map((l) => l.name))];
  const correct = answers.filter((a, i) => a === story.questions[i].answer).length;
  const allAnswered = answers.every((a) => a !== null);

  async function play(slow: boolean) {
    if (playing) {
      abortRef.current?.abort();
      setPlaying(null);
      return;
    }
    primeAudio();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setPlaying({ line: 0, slow });
    try {
      await speakSequence(
        story.lines.map((l) => ({ text: l.text, voiceId: l.voice })),
        (slow ? 0.8 : 1) * prefs.speechRate,
        { signal: ctrl.signal, onLine: (i) => setPlaying({ line: i, slow }) },
      );
    } catch {
      // A voice that failed just ends the playback; the buttons stay usable.
    } finally {
      if (abortRef.current === ctrl) {
        setPlaying(null);
        setPlays((n) => n + 1);
      }
    }
  }

  function answer(qi: number, oi: number) {
    if (answers[qi] !== null) return;
    const next = answers.map((a, i) => (i === qi ? oi : a));
    setAnswers(next);
    if (next.every((a) => a !== null)) {
      learner.recordStory(story.id, next.filter((a, i) => a === story.questions[i].answer).length);
    }
  }

  function savePhrases() {
    learner.addPhrases(
      story.phrases.map((p) => ({
        ...p,
        example: story.lines.find((l) => l.text.toLowerCase().includes(p.text.toLowerCase().replace(/[.?]$/, "")))
          ?.text,
      })),
      "Stories",
    );
    setSaved(true);
  }

  return (
    <div className="space-y-5">
      <header className="flex items-start gap-2">
        <Link href="/listen" aria-label="Back to listening" className="-ml-2 rounded-full p-2 text-dim hover:text-text">
          <ChevronLeft className="size-5" />
        </Link>
        <div className="flex-1">
          <p className="text-xs font-extrabold uppercase tracking-wider text-faint">
            Listening story · {story.level}
            {best !== undefined && ` · best ${best}/${story.questions.length}`}
          </p>
          <h1 className="text-2xl font-black leading-tight">{story.title}</h1>
          <p className="text-sm text-dim">{story.setting}</p>
        </div>
      </header>

      {/* Who's talking, with the line being spoken lit up. The words stay hidden until the end. */}
      <section className="tile space-y-2 p-4" aria-label="The dialogue">
        {story.lines.map((l, i) => (
          <div
            key={i}
            className={clsx(
              "flex items-start gap-2.5 rounded-xl p-2 transition-colors",
              playing?.line === i && "bg-accent-soft",
            )}
          >
            <Avatar name={l.name} size={30} seed={`speaker-${speakers.indexOf(l.name)}`} />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-extrabold text-dim">{l.name}</p>
              {phase === "review" ? (
                <p className="font-bold">{l.text}</p>
              ) : (
                <p
                  aria-hidden
                  className="mt-1 h-3 rounded-full bg-elev-2"
                  style={{ width: `${Math.min(100, 25 + l.text.length)}%` }}
                />
              )}
            </div>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => void play(false)}
          disabled={!!playing && playing.slow}
          className="btn-3d btn-go flex items-center justify-center gap-2 py-3.5 disabled:opacity-60"
        >
          {playing && !playing.slow ? (
            <>
              <Square className="size-4 fill-current" aria-hidden /> Stop
            </>
          ) : (
            <>
              <Play className="size-5 fill-current" aria-hidden /> {plays ? "Play again" : "Play"}
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => void play(true)}
          disabled={!!playing && !playing.slow}
          className="btn-3d btn-ghost flex items-center justify-center gap-2 py-3.5 disabled:opacity-60"
        >
          {playing?.slow ? (
            <Loader2 className="size-5 animate-spin" aria-hidden />
          ) : (
            <Snail className="size-5" aria-hidden />
          )}{" "}
          Slower
        </button>
      </div>

      {phase === "listen" && (
        <button
          type="button"
          onClick={() => {
            abortRef.current?.abort();
            setPhase("questions");
          }}
          disabled={plays === 0}
          className="btn-3d btn-accent w-full py-3.5 uppercase disabled:opacity-50"
        >
          {plays === 0 ? "Listen first" : "Answer the questions"}
        </button>
      )}

      {phase !== "listen" && (
        <section aria-labelledby="q-title" className="space-y-3">
          <h2 id="q-title" className="font-black">
            Questions
          </h2>
          {story.questions.map((q, qi) => {
            const picked = answers[qi];
            return (
              <div key={q.q} className="tile space-y-2.5 p-4">
                <p className="font-extrabold">
                  {qi + 1}. {q.q}
                </p>
                <div role="group" aria-label={q.q} className="grid gap-2">
                  {q.options.map((o, oi) => {
                    const isRight = oi === q.answer;
                    const show = picked !== null;
                    return (
                      <button
                        key={o}
                        type="button"
                        onClick={() => answer(qi, oi)}
                        disabled={show}
                        className={clsx(
                          "flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-left text-sm font-bold",
                          !show && "border-line hover:border-accent/60",
                          show && isRight && "border-go bg-go/10 text-good",
                          show && picked === oi && !isRight && "border-bad bg-bad/10 text-bad",
                          show && picked !== oi && !isRight && "border-line opacity-60",
                        )}
                      >
                        {show && isRight && <Check className="size-4 shrink-0" aria-hidden />}
                        {show && picked === oi && !isRight && <X className="size-4 shrink-0" aria-hidden />}
                        {o}
                      </button>
                    );
                  })}
                </div>
                {picked !== null && <p className="text-sm text-dim">{q.why}</p>}
              </div>
            );
          })}
        </section>
      )}

      {phase === "questions" && allAnswered && (
        <button type="button" onClick={() => setPhase("review")} className="btn-3d btn-go w-full py-3.5 uppercase">
          {correct}/{story.questions.length} right · Read the dialogue
        </button>
      )}

      {phase === "review" && (
        <>
          <section className="tile space-y-2.5 p-4" aria-labelledby="phr-title">
            <h2 id="phr-title" className="font-black">
              Phrases worth keeping
            </h2>
            <ul className="space-y-1.5">
              {story.phrases.map((p) => (
                <li key={p.text} className="text-sm">
                  <span className="font-extrabold">{p.text}</span> <span className="text-dim">· {p.meaningEn}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={savePhrases}
              disabled={saved}
              className="btn-3d btn-ghost flex items-center gap-1.5 px-3 py-2 text-sm disabled:opacity-70"
            >
              {saved ? (
                <>
                  <Check className="size-4" aria-hidden /> Saved to your word cards
                </>
              ) : (
                <>
                  <Plus className="size-4" aria-hidden /> Save to word cards
                </>
              )}
            </button>
          </section>
          <KeepGoing next={null} avoid={[]} />
        </>
      )}

      {phase === "listen" && (
        <p className="flex items-center gap-1.5 text-xs font-bold text-faint">
          <Headphones className="size-4" aria-hidden /> The words show up after the questions. Replay as often as you
          like.
        </p>
      )}
    </div>
  );
}
