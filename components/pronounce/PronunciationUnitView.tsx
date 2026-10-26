"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Languages, Loader2, Mic, Volume2 } from "lucide-react";
import clsx from "clsx";
import type { PronunciationUnit } from "@/content/pronunciation";
import { PRONUNCIATION } from "@/content/pronunciation";
import { learner, useLearner } from "@/lib/client/learner";
import { usePrefs } from "@/lib/client/prefs";
import { useClipPlayer } from "@/lib/client/tts";
import { assessPronunciation, SpeechSetupError, type PronunciationResult } from "@/lib/client/speech";
import { scoreTone } from "./PronunciationCourse";
import { speakable } from "@/lib/text/speakable";

export function PronunciationUnitView({ unit }: { unit: PronunciationUnit }) {
  const state = useLearner();
  const [prefs] = usePrefs();
  const player = useClipPlayer();
  const [showHe, setShowHe] = useState(prefs.hebrewHelp);
  const [attempts, setAttempts] = useState<Record<number, PronunciationResult | "listening" | { error: string }>>({});
  const best = state.pronunciation?.[unit.id]?.best;
  const index = PRONUNCIATION.findIndex((u) => u.id === unit.id);
  const next = PRONUNCIATION[index + 1];

  function listen(text: string, rate = 0.85) {
    const key = `pron:${text}:${rate}`;
    if (player.state?.key === key) player.stop();
    else void player.play(key, text, prefs.tutorVoiceId, rate);
  }

  async function say(i: number, sentence: string) {
    player.stop();
    setAttempts((a) => ({ ...a, [i]: "listening" }));
    try {
      const r = await assessPronunciation(sentence);
      learner.addSpeechUsage(null, { sttSeconds: r.seconds });
      if (r.scored) learner.recordPronunciation(unit.id, r.pronunciation);
      setAttempts((a) => ({ ...a, [i]: r }));
    } catch (err) {
      const kind = err instanceof SpeechSetupError ? err.kind : "unknown";
      const error =
        kind === "mic_denied"
          ? "The microphone is blocked. Allow it in the browser settings."
          : kind === "not_configured"
            ? "Speech isn't connected yet. Finish setup first."
            : "Couldn't listen. Try again.";
      setAttempts((a) => ({ ...a, [i]: { error } }));
    }
  }

  return (
    <div className="space-y-5">
      <header className="flex items-start gap-2">
        <Link
          href="/pronounce"
          aria-label="Back to the course"
          className="-ml-2 rounded-full p-2 text-dim hover:text-text"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <div className="flex-1">
          <p className="text-xs font-extrabold uppercase tracking-wider text-faint">
            Unit {index + 1} · {unit.focus}
          </p>
          <h1 className="text-2xl font-black leading-tight">{unit.title}</h1>
        </div>
        {best !== undefined && (
          <span className={clsx("text-2xl font-black", scoreTone(best))} aria-label={`Best score ${best}`}>
            {best}
          </span>
        )}
      </header>

      <section className="tile space-y-2 p-4">
        <p className="font-extrabold">Why it&apos;s hard</p>
        <p className="text-dim">{unit.whyEn}</p>
        {showHe ? (
          <p dir="rtl" lang="he" className="rounded-lg bg-elev-2 px-2.5 py-1.5 text-sm">
            {unit.whyHe}
          </p>
        ) : (
          <button
            type="button"
            onClick={() => setShowHe(true)}
            className="inline-flex items-center gap-1 text-sm font-extrabold text-accent"
          >
            <Languages className="size-4" aria-hidden /> Translate
          </button>
        )}
        <p className="pt-1 font-extrabold">How to say it</p>
        <p className="text-dim">{unit.how}</p>
      </section>

      <section aria-labelledby="pairs-title" className="space-y-2.5">
        <h2 id="pairs-title" className="font-black">
          Hear the difference
        </h2>
        <ul className="grid gap-2">
          {unit.pairs.map(([target, other]) => {
            const t = speakable(target);
            const o = speakable(other);
            return (
              <li key={target} className="tile flex items-center gap-2 p-2.5">
                <button
                  type="button"
                  disabled={!t}
                  onClick={() => t && listen(t)}
                  className="btn-3d btn-ghost flex flex-1 items-center justify-center gap-1.5 px-2 py-2 text-sm text-good disabled:cursor-default"
                >
                  {t && <Volume2 className="size-4" aria-hidden />} {target}
                </button>
                <span className="text-xs font-bold text-faint">vs</span>
                <button
                  type="button"
                  disabled={!o}
                  onClick={() => o && listen(o)}
                  className="btn-3d btn-ghost flex flex-1 items-center justify-center gap-1.5 px-2 py-2 text-sm text-dim disabled:cursor-default"
                >
                  {o && <Volume2 className="size-4" aria-hidden />} {other}
                </button>
              </li>
            );
          })}
        </ul>
        <p className="text-xs font-bold text-faint">
          Green is the sound you&apos;re practicing; grey is what it often turns into.
        </p>
      </section>

      <section aria-labelledby="say-title" className="space-y-3">
        <h2 id="say-title" className="font-black">
          Say it
        </h2>
        {unit.sentences.map((sentence, i) => {
          const a = attempts[i];
          const result = a && typeof a === "object" && "pronunciation" in a ? a : null;
          return (
            <article key={sentence} className="tile space-y-2.5 p-4">
              <p className="text-lg font-extrabold leading-snug">{sentence}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => listen(sentence, 0.9)}
                  className="btn-3d btn-ghost flex items-center gap-1.5 px-3 py-2 text-sm"
                >
                  <Volume2 className="size-4" aria-hidden /> Listen
                </button>
                <button
                  type="button"
                  onClick={() => void say(i, sentence)}
                  disabled={a === "listening"}
                  className="btn-3d btn-go flex flex-1 items-center justify-center gap-1.5 px-3 py-2 text-sm disabled:opacity-70"
                >
                  {a === "listening" ? (
                    <>
                      <Loader2 className="size-4 animate-spin" aria-hidden /> Listening… say it now
                    </>
                  ) : (
                    <>
                      <Mic className="size-4" aria-hidden /> {result ? "Try again" : "Say it"}
                    </>
                  )}
                </button>
              </div>
              {a && typeof a === "object" && "error" in a && <p className="text-sm font-bold text-bad">{a.error}</p>}
              {result && (
                <div className="space-y-2 rounded-xl bg-elev-2 p-3" aria-live="polite">
                  {!result.scored && (
                    <p className="text-xs text-faint">Word check only. Sound scores come once Azure is connected.</p>
                  )}
                  <p className={clsx("flex-wrap gap-x-4 gap-y-1 text-sm font-bold", result.scored ? "flex" : "hidden")}>
                    <span>
                      Pronunciation{" "}
                      <span className={scoreTone(result.pronunciation)}>{Math.round(result.pronunciation)}</span>
                    </span>
                    <span>
                      Fluency <span className={scoreTone(result.fluency)}>{Math.round(result.fluency)}</span>
                    </span>
                    {result.prosody !== null && (
                      <span>
                        Intonation <span className={scoreTone(result.prosody)}>{Math.round(result.prosody)}</span>
                      </span>
                    )}
                  </p>
                  <p className="flex flex-wrap gap-1.5" aria-label="Word by word">
                    {result.words.map((w, j) => (
                      <span
                        key={j}
                        className={clsx(
                          "rounded-md px-1.5 py-0.5 text-sm font-bold",
                          w.error === "Omission"
                            ? "bg-bad/15 text-bad line-through"
                            : w.accuracy >= 80
                              ? "bg-go/15 text-good"
                              : w.accuracy >= 60
                                ? "bg-warn/15 text-warn"
                                : "bg-bad/15 text-bad",
                        )}
                      >
                        {w.word}
                      </span>
                    ))}
                  </p>
                </div>
              )}
            </article>
          );
        })}
      </section>

      {player.error && (
        <p role="alert" className="text-sm font-bold text-bad">
          The voice isn&apos;t available. Finish setup first.
        </p>
      )}

      {next && (
        <Link href={`/pronounce/${next.id}`} className="btn-3d btn-accent flex w-full items-center justify-center py-3">
          Next: {next.title}
        </Link>
      )}
    </div>
  );
}
