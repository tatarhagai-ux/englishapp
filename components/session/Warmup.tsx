"use client";

import { useState } from "react";
import { ArrowRight, Check, Eye, Languages, Mic, RotateCcw, Sparkles } from "lucide-react";
import clsx from "clsx";
import type { WarmupItem } from "@/lib/learner/model";
import { SpeechSetupError } from "@/lib/client/speech";
import { useMicAttempt } from "@/lib/client/use-mic-attempt";
import { MicBusyLabel, MicHeard } from "@/components/MicLive";
import { learner } from "@/lib/client/learner";
import { saidCorrectly, usedPhrase } from "@/lib/text/compare";

interface Props {
  items: WarmupItem[];
  mode: "voice" | "quiet";
  /** The conversation it warms up for; null for a standalone quick review. */
  sessionId: string | null;
  hebrewHelp: boolean;
  onDone: () => void;
  /** Inside a page with the bottom bar: leave room for it so the buttons stay visible. */
  embedded?: boolean;
}

type Attempt = { status: "idle" | "checked" | "error"; said?: string; ok?: boolean; error?: string };

/**
 * Two-minute warm-up before the conversation. Mistakes are active recall: you see what you
 * said wrong last time and produce the right version yourself before seeing it. Phrases
 * are said out loud from their meaning. Every answer schedules the next review (FSRS).
 */
export function Warmup({ items, mode, sessionId, hebrewHelp, onDone, embedded = false }: Props) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [attempt, setAttempt] = useState<Attempt>({ status: "idle" });
  const mic = useMicAttempt();
  const [typed, setTyped] = useState("");
  const [showHe, setShowHe] = useState(hebrewHelp);
  const [reviewed, setReviewed] = useState(0);
  /** Only the first answer schedules the review; retries are practice. */
  const [recorded, setRecorded] = useState(false);
  const item = items[index];

  function record(ok: boolean) {
    if (recorded) return;
    setRecorded(true);
    if (item.kind === "phrase") learner.reviewPhrase(item.id, ok);
    else learner.reviewMistake(item.id, ok);
    setReviewed((n) => n + 1);
  }

  const isRight = (answer: string) =>
    item.kind === "phrase" ? usedPhrase(answer, item.target) : saidCorrectly(answer, item.target);

  function next() {
    if (index + 1 >= items.length) {
      if (sessionId) learner.addReviews(sessionId, reviewed);
      onDone();
      return;
    }
    setIndex(index + 1);
    setRevealed(false);
    setRecorded(false);
    setAttempt({ status: "idle" });
    setTyped("");
    setShowHe(hebrewHelp);
  }

  async function speak() {
    if (mic.busy) return mic.stop();
    setAttempt({ status: "idle" });
    try {
      const r = await mic.run(item.target);
      learner.addSpeechUsage(sessionId, { sttSeconds: r.seconds });
      const ok = isRight(r.text);
      record(ok);
      setRevealed(true);
      setAttempt({ status: "checked", said: r.text, ok });
    } catch (err) {
      const kind = err instanceof SpeechSetupError ? err.kind : "unknown";
      setAttempt({
        status: "error",
        error:
          kind === "mic_denied"
            ? "The microphone is blocked. Type it instead."
            : kind === "no_speech"
              ? "I didn't hear anything. Tap and say it once the red dot shows."
              : "Couldn't listen. Try again or type it.",
      });
    }
  }

  function checkTyped(e: React.FormEvent) {
    e.preventDefault();
    if (!typed.trim()) return;
    const ok = isRight(typed);
    record(ok);
    setRevealed(true);
    setAttempt({ status: "checked", said: typed, ok });
  }

  function giveUp() {
    record(false);
    setRevealed(true);
    setAttempt({ status: "checked", ok: false });
  }

  const hebrew = item.kind === "phrase" ? item.hebrew : item.whyHe;

  return (
    <div
      className={clsx(
        "mx-auto flex max-w-xl flex-col gap-5",
        embedded ? "min-h-[calc(100dvh-8.5rem)]" : "min-h-dvh px-4 py-6",
      )}
    >
      <header className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-faint">
            <Sparkles className="size-4 text-xp" aria-hidden /> Warm-up
          </p>
          <button type="button" onClick={onDone} className="text-sm font-extrabold text-dim hover:text-text">
            Skip
          </button>
        </div>
        <div className="flex gap-1.5" aria-label={`Item ${index + 1} of ${items.length}`}>
          {items.map((_, i) => (
            <span key={i} className={clsx("h-2.5 flex-1 rounded-full", i <= index ? "bg-go" : "bg-elev-2")} />
          ))}
        </div>
      </header>

      <section className="tile space-y-3 p-5">
        {item.kind === "mistake" ? (
          <>
            <p className="font-extrabold">Earlier you said:</p>
            <p className="text-lg text-bad line-through decoration-bad/60">{item.wrong}</p>
            <p className="font-extrabold">How do you say it correctly?</p>
          </>
        ) : (
          <>
            {item.interview ? (
              <>
                <p className="font-extrabold">Interview question:</p>
                <p className="text-dim">“{item.meaning}”</p>
                <p className="font-extrabold">Open your answer with your saved line:</p>
              </>
            ) : (
              <>
                <p className="font-extrabold">Say this phrase in a sentence of your own, or just the phrase:</p>
                {item.meaning && <p className="text-dim">Means: {item.meaning}</p>}
              </>
            )}
          </>
        )}

        {(revealed || item.kind === "phrase") && (
          <p className="text-xl font-black leading-snug text-good">{item.target}</p>
        )}
        {revealed && item.kind === "mistake" && item.why && <p className="text-sm text-dim">{item.why}</p>}
        {revealed &&
          hebrew &&
          (showHe ? (
            <p dir="rtl" lang="he" className="rounded-lg bg-elev-2 px-2.5 py-1.5 text-sm">
              {hebrew}
            </p>
          ) : (
            <button
              type="button"
              onClick={() => setShowHe(true)}
              className="inline-flex items-center gap-1 text-sm font-extrabold text-accent"
            >
              <Languages className="size-4" aria-hidden /> Translate
            </button>
          ))}
      </section>

      {attempt.status === "checked" && (
        <p
          role="status"
          className={clsx("rounded-xl p-3 font-extrabold", attempt.ok ? "bg-go/15 text-good" : "bg-warn/15 text-warn")}
        >
          {attempt.ok ? (
            <span className="flex items-center gap-2">
              <Check className="size-5" strokeWidth={3} aria-hidden /> Correct. It&apos;ll come back later to lock it
              in.
            </span>
          ) : attempt.said ? (
            `Not quite: “${attempt.said}”. Say the green version once, then continue.`
          ) : (
            "Here it is. Say it out loud once, then continue. It'll come back soon."
          )}
        </p>
      )}
      {attempt.status === "error" && <p className="rounded-xl bg-bad/10 p-3 font-bold text-bad">{attempt.error}</p>}

      <div className="mt-auto space-y-3">
        {attempt.status === "checked" ? (
          <>
            <button
              type="button"
              onClick={next}
              className="btn-3d btn-go flex w-full items-center justify-center gap-2 py-4 uppercase"
            >
              {index + 1 >= items.length ? "Start the conversation" : "Next"}{" "}
              <ArrowRight className="size-5" aria-hidden />
            </button>
            {!attempt.ok && (
              <button
                type="button"
                onClick={() => {
                  setTyped("");
                  setAttempt({ status: "idle" });
                }}
                className="btn-3d btn-ghost flex w-full items-center justify-center gap-2 py-3"
              >
                <RotateCcw className="size-4" aria-hidden /> Try again
              </button>
            )}
          </>
        ) : mode === "voice" && attempt.status !== "error" ? (
          <>
            <button
              type="button"
              onClick={() => void speak()}
              disabled={mic.phase === "opening"}
              className="btn-3d btn-go flex w-full items-center justify-center gap-2 py-4 uppercase disabled:opacity-70"
            >
              {mic.busy ? (
                <MicBusyLabel phase={mic.phase} />
              ) : (
                <>
                  <Mic className="size-5" aria-hidden /> Say it
                </>
              )}
            </button>
            <MicHeard phase={mic.phase} heard={mic.heard} />
            {item.kind === "mistake" && (
              <button
                type="button"
                onClick={giveUp}
                className="btn-3d btn-ghost flex w-full items-center justify-center gap-2 py-3"
              >
                <Eye className="size-4" aria-hidden /> Show me the answer
              </button>
            )}
          </>
        ) : (
          <form onSubmit={checkTyped} className="space-y-3">
            <label htmlFor="warmup-answer" className="sr-only">
              Your answer
            </label>
            <input
              id="warmup-answer"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="Type the correct sentence…"
              autoComplete="off"
              className="w-full rounded-xl border-2 border-line bg-elev-2 px-4 py-3 outline-none focus:border-accent"
            />
            <button
              type="submit"
              disabled={!typed.trim()}
              className="btn-3d btn-go w-full py-4 uppercase disabled:opacity-60"
            >
              Check
            </button>
            {item.kind === "mistake" && (
              <button
                type="button"
                onClick={giveUp}
                className="btn-3d btn-ghost flex w-full items-center justify-center gap-2 py-3"
              >
                <RotateCcw className="size-4" aria-hidden /> Show me the answer
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
