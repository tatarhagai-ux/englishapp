"use client";

import { HowItWorks } from "@/components/HowItWorks";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, Headphones, Keyboard, Loader2, Mic, Play, Snail, Trophy } from "lucide-react";
import clsx from "clsx";
import { STORIES, type Story } from "@/content/stories";
import { RADIO } from "@/content/radio";
import { LISTENING, type ListeningItem } from "@/content/listening";
import { VOICES, type Accent, type Voice } from "@/content/voices";
import { learner, useHydrated, useLearner } from "@/lib/client/learner";
import { useClipPlayer } from "@/lib/client/tts";
import { useWakeLock } from "@/lib/client/wake-lock";
import { primeAudio, SpeechSetupError, type PronunciationResult } from "@/lib/client/speech";
import { useMicAttempt } from "@/lib/client/use-mic-attempt";
import { MicBusyLabel, MicHeard } from "@/components/MicLive";
import { LISTENING_START, pickListeningItems } from "@/lib/learner/model";
import { diffWords, type DiffToken } from "@/lib/text/diff";
import { saidCorrectly } from "@/lib/text/compare";
import { dayKey } from "@/lib/game/streak";

type Mode = "dictation" | "shadowing";
type AccentChoice = Accent | "Mixed";
const ROUND = 8;
const ACCENTS: AccentChoice[] = ["Mixed", "American", "British", "Australian", "Indian"];

interface Result {
  correct: boolean;
  tokens?: DiffToken[];
  pron?: PronunciationResult;
}

export function ListeningGym() {
  const hydrated = useHydrated();
  const state = useLearner();
  // Ones he hasn't heard come first, in their order; the first of them is marked Next.
  const unheardFirst = (list: readonly Story[]) =>
    hydrated ? [...list].sort((a, b) => Number(!!state.stories?.[a.id]) - Number(!!state.stories?.[b.id])) : list;
  const listening = state.listening ?? LISTENING_START;
  const [mode, setMode] = useState<Mode>("dictation");
  const [accent, setAccent] = useState<AccentChoice>("Mixed");
  const [round, setRound] = useState<{ items: ListeningItem[]; voices: Voice[]; rate: number } | null>(null);
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [score, setScore] = useState(0);
  const mic = useMicAttempt();
  const [micError, setMicError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const player = useClipPlayer();
  const autoplayed = useRef(-1);
  useWakeLock(Boolean(round) && !done);

  const voicePool = useMemo(() => VOICES.filter((v) => accent === "Mixed" || v.accent === accent), [accent]);

  function start() {
    primeAudio();
    const items = pickListeningItems(LISTENING, listening.heard, ROUND, Date.now() % 100000);
    const voices = items.map(
      (_, i) => voicePool[(i * 5 + Math.floor(Math.random() * voicePool.length)) % voicePool.length],
    );
    setRound({ items, voices, rate: listening.rate });
    setIndex(0);
    setScore(0);
    setResult(null);
    setTyped("");
    setDone(false);
    autoplayed.current = -1;
  }

  const item = round?.items[index];
  const voice = round?.voices[index];

  function play(rate: number) {
    if (!item || !voice) return;
    void player.play(`${item.id}:${voice.id}:${rate}`, item.text, voice.id, rate);
  }

  useEffect(() => {
    if (!round || !item || autoplayed.current === index) return;
    autoplayed.current = index;
    // The live rate: it adapts within the round (3 right in a row speeds up, a miss slows down).
    play(learner.get().listening?.rate ?? round.rate);
    // Autoplay once per item.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, index]);

  function settle(correct: boolean, extra: Omit<Result, "correct">) {
    if (!item) return;
    learner.recordListening(item.id, correct);
    if (correct) setScore((s) => s + 1);
    setResult({ correct, ...extra });
  }

  function check(e: React.FormEvent) {
    e.preventDefault();
    if (!item || !typed.trim()) return;
    const { tokens, accuracy } = diffWords(typed, item.text);
    settle(accuracy >= 0.9, { tokens });
  }

  async function shadow() {
    if (!item) return;
    if (mic.busy) return mic.stop();
    player.stop();
    setMicError(null);
    try {
      const pron = await mic.run(item.text);
      learner.addSpeechUsage(null, { sttSeconds: pron.seconds });
      settle(saidCorrectly(pron.text, item.text) && (!pron.scored || pron.pronunciation >= 60), { pron });
    } catch (err) {
      const kind = err instanceof SpeechSetupError ? err.kind : "unknown";
      setMicError(
        kind === "mic_denied"
          ? "The microphone is blocked. Use dictation instead."
          : kind === "no_speech"
            ? "I didn't hear anything. Tap and repeat it once the red dot shows."
            : kind === "not_configured"
              ? "Speech isn't connected yet. Finish setup first."
              : "Couldn't listen. Try again.",
      );
    }
  }

  function next() {
    if (!round) return;
    if (index + 1 >= round.items.length) {
      learner.finishListeningRound({
        day: dayKey(new Date()),
        mode,
        correct: score,
        total: round.items.length,
        rate: learner.get().listening?.rate ?? round.rate,
      });
      setDone(true);
      return;
    }
    setIndex(index + 1);
    setResult(null);
    setTyped("");
  }

  // Setup -----------------------------------------------------------------------------------
  if (!round || done) {
    const last = listening.rounds.at(-1);
    return (
      <div className="space-y-5">
        <header className="flex items-center gap-2">
          <Link
            href="/practice"
            aria-label="Back to practice"
            className="-ml-2 rounded-full p-2 text-dim hover:text-text"
          >
            <ChevronLeft className="size-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Listening gym</h1>
            <p className="text-sm text-dim">Real, fast, accented English, until it stops being hard.</p>
            <HowItWorks
              steps={[
                "Pick Dictation (type what you hear) or Shadowing (say it back the same way).",
                "Listen. Tap the snail to hear it slower, or replay as often as you need.",
                "Three right in a row and the speed goes up a little. A miss brings it down.",
              ]}
              why="Real people speak fast and with accents. This trains your ear to keep up."
            />
          </div>
        </header>

        {done && round && (
          <section className="rounded-3xl bg-go p-5 text-go-ink" style={{ boxShadow: "0 6px 0 var(--go-deep)" }}>
            <p className="flex items-center gap-2 text-lg font-black">
              <Trophy className="size-6" aria-hidden /> {score} of {round.items.length} correct · +{score * 5} XP
            </p>
            <p className="mt-1 font-bold">
              {listening.rate > round.rate
                ? `Faster! You went from ${round.rate.toFixed(2)}× to ${listening.rate.toFixed(2)}×.`
                : listening.rate < round.rate
                  ? `Slowed to ${listening.rate.toFixed(2)}× to lock it in. It speeds up again after 3 in a row.`
                  : `You held ${listening.rate.toFixed(2)}×.`}
            </p>
          </section>
        )}

        <section id="stories" aria-labelledby="stories-title" className="scroll-mt-4 space-y-2.5">
          <div>
            <h2 id="stories-title" className="font-black">
              Stories
            </h2>
            <p className="text-sm text-dim">
              A short real conversation, then three questions. Words appear at the end.
            </p>
          </div>
          <div className="-mx-4 flex snap-x gap-2.5 overflow-x-auto px-4 pb-1">
            {unheardFirst(STORIES).map((s, i) => {
              const best = hydrated ? state.stories?.[s.id]?.best : undefined;
              const isNext = hydrated && i === 0 && best === undefined;
              return (
                <Link
                  key={s.id}
                  href={`/listen/story/${s.id}`}
                  className="tile w-44 shrink-0 snap-start space-y-1 p-3.5 transition-colors hover:border-accent/60"
                >
                  <p className="text-xs font-extrabold text-faint">
                    {s.level} · {s.lines.length} lines
                  </p>
                  <p className="font-extrabold leading-snug">{s.title}</p>
                  <p
                    className={clsx(
                      "text-xs font-bold",
                      isNext ? "text-accent" : best === undefined ? "text-dim" : best === 3 ? "text-good" : "text-warn",
                    )}
                  >
                    {isNext ? "Next" : best === undefined ? "New" : `Best ${best}/3`}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>

        <section id="radio" aria-labelledby="radio-title" className="scroll-mt-4 space-y-2.5">
          <div>
            <h2 id="radio-title" className="font-black">
              Radio
            </h2>
            <p className="text-sm text-dim">
              Two to three minutes of one person talking, like a podcast. Three questions at the end.
            </p>
          </div>
          <div className="-mx-4 flex snap-x gap-2.5 overflow-x-auto px-4 pb-1">
            {unheardFirst(RADIO).map((s, i) => {
              const best = hydrated ? state.stories?.[s.id]?.best : undefined;
              const isNext = hydrated && i === 0 && best === undefined;
              return (
                <Link
                  key={s.id}
                  href={`/listen/story/${s.id}`}
                  className="tile w-44 shrink-0 snap-start space-y-1 p-3.5 transition-colors hover:border-accent/60"
                >
                  <p className="text-xs font-extrabold text-faint">
                    {s.level} ·{" "}
                    {Math.max(1, Math.round(s.lines.reduce((n, l) => n + l.text.split(" ").length, 0) / 130))} min
                  </p>
                  <p className="font-extrabold leading-snug">{s.title}</p>
                  <p
                    className={clsx(
                      "text-xs font-bold",
                      isNext ? "text-accent" : best === undefined ? "text-dim" : best === 3 ? "text-good" : "text-warn",
                    )}
                  >
                    {isNext ? "Next" : best === undefined ? "New" : `Best ${best}/3`}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="tile grid grid-cols-2 gap-3 p-4">
          <div>
            <p className="text-xs font-bold text-dim">Your listening speed</p>
            <p className="text-3xl font-black text-accent">{hydrated ? listening.rate.toFixed(2) : "0.90"}×</p>
          </div>
          <div>
            <p className="text-xs font-bold text-dim">Sentences heard</p>
            <p className="text-3xl font-black">{hydrated ? `${listening.heard.length}/${LISTENING.length}` : "—"}</p>
          </div>
          <p className="col-span-2 text-xs font-bold text-faint">
            Three right in a row speeds it up, a miss slows it down. Native conversation is about 1.0× to 1.2×.
            {last ? ` Last round: ${last.correct}/${last.total}.` : ""}
          </p>
        </section>

        <div role="group" aria-label="Exercise" className="grid grid-cols-2 gap-3">
          {(
            [
              { m: "dictation", icon: Keyboard, title: "Dictation", detail: "Hear it, type it" },
              { m: "shadowing", icon: Mic, title: "Shadowing", detail: "Hear it, say it the same way" },
            ] as const
          ).map(({ m, icon: Icon, title, detail }) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              aria-pressed={mode === m}
              className={clsx(
                "tile flex flex-col items-start gap-1 p-3.5 text-left",
                mode === m ? "border-accent bg-accent-soft" : "hover:border-accent/50",
              )}
            >
              <Icon className={clsx("size-5", mode === m ? "text-accent" : "text-dim")} aria-hidden />
              <span className="font-extrabold">{title}</span>
              <span className="text-xs font-bold text-dim">{detail}</span>
            </button>
          ))}
        </div>

        <div>
          <p className="mb-2 text-sm font-extrabold">Accents</p>
          <div role="group" aria-label="Accents" className="flex flex-wrap gap-2">
            {ACCENTS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAccent(a)}
                aria-pressed={accent === a}
                className={clsx(
                  "rounded-full border-2 px-3 py-1.5 text-sm font-extrabold",
                  accent === a ? "border-accent bg-accent-soft text-accent" : "border-line text-dim",
                )}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={start}
          className="btn-3d btn-go flex w-full items-center justify-center gap-2 py-4 text-lg uppercase"
        >
          <Headphones className="size-5" aria-hidden /> {done ? "Another round" : `Start ${ROUND} sentences`}
        </button>
      </div>
    );
  }

  // Round -------------------------------------------------------------------------------------
  const loading = player.state?.status === "loading";
  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setRound(null)}
            className="text-sm font-extrabold text-dim hover:text-text"
          >
            Quit
          </button>
          <p className="text-sm font-extrabold text-dim">
            {voice?.displayName} · {voice?.accent} · {listening.rate.toFixed(2)}×
          </p>
        </div>
        <div className="flex gap-1.5" aria-label={`Sentence ${index + 1} of ${round.items.length}`}>
          {round.items.map((_, i) => (
            <span key={i} className={clsx("h-2.5 flex-1 rounded-full", i <= index ? "bg-go" : "bg-elev-2")} />
          ))}
        </div>
      </header>

      <section className="tile flex flex-col items-center gap-4 p-6">
        <button
          type="button"
          onClick={() => play(listening.rate)}
          aria-label="Play the sentence"
          className="btn-3d btn-accent grid size-20 place-items-center rounded-full"
        >
          {loading ? (
            <Loader2 className="size-8 animate-spin" />
          ) : (
            <Play className="size-8 translate-x-0.5 fill-current" />
          )}
        </button>
        <button
          type="button"
          onClick={() => play(Math.max(0.6, listening.rate - 0.25))}
          className="inline-flex items-center gap-1.5 text-sm font-extrabold text-dim hover:text-text"
        >
          <Snail className="size-4" aria-hidden /> Play slower
        </button>
        {player.error && (
          <p className="text-sm font-bold text-bad">The voice isn&apos;t available. Finish setup first.</p>
        )}
      </section>

      {!result ? (
        mode === "dictation" ? (
          <form onSubmit={check} className="space-y-3">
            <label htmlFor="dictation" className="font-extrabold">
              Type exactly what you heard
            </label>
            <input
              id="dictation"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              className="w-full rounded-xl border-2 border-line bg-elev-2 px-4 py-3 outline-none focus:border-accent"
            />
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => settle(false, { tokens: diffWords("", item!.text).tokens })}
                className="btn-3d btn-ghost py-3 text-sm"
              >
                Show me
              </button>
              <button
                type="submit"
                disabled={!typed.trim()}
                className="btn-3d btn-go col-span-2 py-3 uppercase disabled:opacity-60"
              >
                Check
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            <p className="text-center font-extrabold">Listen, then repeat it with the same rhythm and melody.</p>
            <button
              type="button"
              onClick={() => void shadow()}
              disabled={mic.phase === "opening"}
              className="btn-3d btn-go flex w-full items-center justify-center gap-2 py-4 uppercase disabled:opacity-70"
            >
              {mic.busy ? (
                <MicBusyLabel phase={mic.phase} />
              ) : (
                <>
                  <Mic className="size-5" aria-hidden /> Repeat it
                </>
              )}
            </button>
            <MicHeard phase={mic.phase} heard={mic.heard} />
            {micError && <p className="text-sm font-bold text-bad">{micError}</p>}
            <button type="button" onClick={() => settle(false, {})} className="btn-3d btn-ghost w-full py-3 text-sm">
              Show me the sentence
            </button>
          </div>
        )
      ) : (
        <section className="space-y-3" aria-live="polite">
          <p
            className={clsx(
              "rounded-xl p-3 font-extrabold",
              result.correct ? "bg-go/15 text-good" : "bg-warn/15 text-warn",
            )}
          >
            {result.correct ? "Got it! +5 XP" : "Not quite. Here's the sentence."}
          </p>
          <p className="tile p-4 text-lg font-extrabold leading-snug">{item!.text}</p>
          {result.tokens && (
            <p className="flex flex-wrap gap-1.5" aria-label="Your answer word by word">
              {result.tokens.map((t, i) => (
                <span
                  key={i}
                  className={clsx(
                    "rounded-md px-1.5 py-0.5 text-sm font-bold",
                    t.status === "ok" && "bg-go/15 text-good",
                    t.status === "missed" && "bg-warn/15 text-warn",
                    t.status === "extra" && "bg-bad/15 text-bad line-through",
                  )}
                >
                  {t.word}
                </span>
              ))}
            </p>
          )}
          {result.pron && !result.pron.scored && (
            <p className="text-xs text-faint">Word check only. Sound scores come once Azure is connected.</p>
          )}
          {result.pron?.scored && (
            <p className="text-sm font-bold">
              Pronunciation {Math.round(result.pron.pronunciation)} · Fluency {Math.round(result.pron.fluency)}
              {result.pron.prosody !== null ? ` · Intonation ${Math.round(result.pron.prosody)}` : ""}
            </p>
          )}
          {item!.note && <p className="text-sm text-dim">Tip: {item!.note}</p>}
          <button
            type="button"
            onClick={next}
            className="btn-3d btn-go flex w-full items-center justify-center gap-2 py-4 uppercase"
          >
            {index + 1 >= round.items.length ? "Finish" : "Next"} <ArrowRight className="size-5" aria-hidden />
          </button>
        </section>
      )}
    </div>
  );
}
