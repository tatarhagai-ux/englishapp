"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowRight, Check, ChevronLeft, Eye, Keyboard, Languages, Mic, RotateCcw, Volume2 } from "lucide-react";
import clsx from "clsx";
import { SAY_SETS, type SaySet } from "@/content/say";
import { HEBREW_PATTERNS } from "@/content/l1/he";
import { learner, useHydrated, useLearner } from "@/lib/client/learner";
import { usePrefs } from "@/lib/client/prefs";
import { useClipPlayer } from "@/lib/client/tts";
import { useMicAttempt } from "@/lib/client/use-mic-attempt";
import { useWakeLock } from "@/lib/client/wake-lock";
import { checkSay, type SayCheck } from "@/lib/text/say-check";
import { HowItWorks } from "@/components/HowItWorks";
import { KeepGoing } from "@/components/KeepGoing";
import { MicBusyLabel, MicHeard } from "@/components/MicLive";

function quoted(words: string[]) {
  return words.map((w) => `“${w}”`).join(", ");
}

function patternOf(set: SaySet) {
  return HEBREW_PATTERNS.find((p) => p.key === set.pattern);
}

/** The sets, one per Hebrew-speaker pattern, with his best score on each. */
export function SayList() {
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
          <h1 className="text-2xl font-black tracking-tight">Say it in English</h1>
          <p className="text-sm text-dim">
            A sentence in Hebrew, you say it in English. Each set is a trap Hebrew speakers fall into.
          </p>
          <HowItWorks
            steps={[
              "Read the Hebrew, then say the English out loud (or type it).",
              "Close isn't enough here: a missing “a” or an extra “to” counts, and you'll see exactly which word.",
              "Missed ones come back at the end of the set for a second go.",
            ]}
            why="Translating out loud makes you build the English sentence yourself, which is where these habits get fixed. Reading the right version isn't the same as producing it."
          />
        </div>
      </header>
      <ul className="space-y-2.5">
        {SAY_SETS.map((s) => {
          const best = hydrated ? state.sayDrills?.[s.id]?.best : undefined;
          return (
            <li key={s.id}>
              <Link
                href={`/say/${s.id}`}
                className="tile flex items-center gap-3 p-4 transition-colors hover:border-accent/60"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
                  <Languages className="size-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-extrabold">{s.title}</span>
                  <span className="block truncate text-xs font-bold text-dim">
                    {patternOf(s)?.title} · {s.items.length} sentences
                  </span>
                </span>
                <span
                  className={clsx(
                    "text-xs font-black",
                    best === undefined ? "text-faint" : best === s.items.length ? "text-good" : "text-warn",
                  )}
                >
                  {best === undefined ? "New" : `${best}/${s.items.length}`}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

interface Attempt {
  heard: string;
  check: SayCheck;
}

/**
 * One set: the rule at the top, then each Hebrew sentence. The score is the sentences he got
 * right on the first try; a missed one comes back once at the end.
 */
export function SayDrill({ set }: { set: SaySet }) {
  const [prefs] = usePrefs();
  const player = useClipPlayer();
  const mic = useMicAttempt();
  const pattern = patternOf(set);
  const [queue, setQueue] = useState(() => set.items.map((_, i) => i));
  const [pos, setPos] = useState(0);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [typing, setTyping] = useState(false);
  const [typed, setTyped] = useState("");
  // Refs, not state: a mic result lands after an await and must see the latest values.
  const firstTry = useRef(new Set<number>());
  const tried = useRef(new Set<number>());
  const listenFor = useRef<number | null>(null);
  const [score, setScore] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [ruleOpen, setRuleOpen] = useState(true);
  const [finished, setFinished] = useState(false);
  useWakeLock(!finished);

  const itemIndex = queue[pos];
  const item = set.items[itemIndex];
  const right = attempt?.check.status === "right";
  const total = set.items.length;
  const firstPass = pos < total;
  const answer = attempt?.check.closest ?? item?.answers[0];
  // He fell into exactly the trap: no need to show it back to him.
  const saidTrap = !!attempt && !!item?.trap && checkSay(attempt.heard, [item.trap]).status === "right";

  function hear(text: string) {
    void player.play(`say:${text}`, text, prefs.tutorVoiceId, 0.95);
  }

  /** The first answer to a sentence decides the score; a miss comes back once at the end. */
  function firstAnswer(index: number, ok: boolean) {
    if (tried.current.has(index)) return;
    tried.current.add(index);
    if (ok) firstTry.current.add(index);
    else setQueue((q) => [...q, index]);
  }

  function judge(heard: string) {
    const check = checkSay(heard, item.answers);
    setAttempt({ heard, check });
    setNotice(null);
    setRuleOpen(false);
    firstAnswer(itemIndex, check.status === "right");
    if (check.status === "right") hear(check.closest);
  }

  /** Switching to typing or to the answer drops a recording in progress, unjudged. */
  function cancelMic() {
    listenFor.current = null;
    mic.stop();
  }

  async function say() {
    if (mic.busy) return mic.stop();
    setRuleOpen(false);
    setNotice(null);
    listenFor.current = itemIndex;
    try {
      const r = await mic.run(item.answers[0]);
      if (listenFor.current !== itemIndex) return;
      // Silence isn't an answer: nothing is scored, he just goes again.
      if (r.text.trim()) judge(r.text);
      else setNotice("Didn't catch that. Try again, or type it.");
    } catch {
      // No mic or no recognition here: typing works everywhere.
      if (listenFor.current === itemIndex) setTyping(true);
    } finally {
      listenFor.current = null;
    }
  }

  function show() {
    cancelMic();
    setRevealed(true);
    setNotice(null);
    setRuleOpen(false);
    firstAnswer(itemIndex, false);
  }

  function next() {
    player.stop();
    setAttempt(null);
    setRevealed(false);
    setNotice(null);
    setTyped("");
    if (pos + 1 >= queue.length) {
      learner.recordSayDrill(set.id, firstTry.current.size);
      setScore(firstTry.current.size);
      setFinished(true);
      return;
    }
    setPos(pos + 1);
  }

  function restart() {
    setQueue(set.items.map((_, i) => i));
    setPos(0);
    firstTry.current = new Set();
    tried.current = new Set();
    setAttempt(null);
    setRevealed(false);
    setFinished(false);
  }

  const header = (
    <header className="flex items-start gap-2">
      <Link
        href="/say"
        aria-label="Back to Say it in English"
        className="-ml-2 rounded-full p-2 text-dim hover:text-text"
      >
        <ChevronLeft className="size-5" />
      </Link>
      <div className="flex-1">
        <p className="text-xs font-extrabold uppercase tracking-wider text-faint">Say it in English</p>
        <h1 className="text-2xl font-black leading-tight">{set.title}</h1>
      </div>
    </header>
  );

  if (finished) {
    return (
      <div className="space-y-5">
        {header}
        <section className="tile space-y-3 p-5 text-center">
          <p className="text-4xl font-black">
            {score}/{set.items.length}
          </p>
          <p className="font-bold text-dim">
            {score === set.items.length
              ? "All of them on the first try."
              : "Right on the first try. The missed ones got a second go."}
          </p>
          {pattern && <p className="rounded-xl bg-elev-2 p-3 text-sm font-bold">{pattern.tip}</p>}
          <button
            type="button"
            onClick={restart}
            className="btn-3d btn-ghost mx-auto flex items-center gap-2 px-4 py-2.5 text-sm"
          >
            <RotateCcw className="size-4" aria-hidden /> Go again
          </button>
        </section>
        <KeepGoing next={null} avoid={[]} />
      </div>
    );
  }

  const done = attempt !== null || revealed;
  return (
    <div className="space-y-5">
      {header}

      {pattern && (
        <section className="tile p-4">
          <button
            type="button"
            onClick={() => setRuleOpen((v) => !v)}
            aria-expanded={ruleOpen}
            className="flex w-full items-center justify-between text-left font-black"
          >
            The rule: {pattern.title}
            <span className="text-xs font-extrabold text-accent">{ruleOpen ? "Hide" : "Show"}</span>
          </button>
          {ruleOpen && (
            <div className="mt-2 space-y-1.5 text-sm">
              <p className="font-bold">{pattern.tip}</p>
              {pattern.example && pattern.fix && (
                <p>
                  <span className="text-bad line-through decoration-2">{pattern.example}</span>{" "}
                  <span className="font-bold text-good">{pattern.fix}</span>
                </p>
              )}
              <p dir="rtl" lang="he" className="text-dim">
                {pattern.whyHe}
              </p>
            </div>
          )}
        </section>
      )}

      <div
        className="h-2.5 overflow-hidden rounded-full bg-elev-2"
        role="progressbar"
        aria-label={firstPass ? `Sentence ${pos + 1} of ${total}` : "Once more"}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={Math.min(pos, total)}
      >
        {/* Out of the set's sentences, so a miss added at the end never moves it backward. */}
        <div className="h-full rounded-full bg-go" style={{ width: `${(Math.min(pos, total) / total) * 100}%` }} />
      </div>

      <section className="tile space-y-4 p-5">
        <p className="text-xs font-extrabold uppercase tracking-wider text-faint">
          {firstPass ? "How do you say it in English?" : "Once more"}
        </p>
        <p dir="rtl" lang="he" className="text-2xl font-black leading-snug">
          {item.he}
        </p>
        {mic.busy && <MicHeard phase={mic.phase} heard={mic.heard} />}
        {notice && !mic.busy && (
          <p role="status" className="text-sm font-bold text-warn">
            {notice}
          </p>
        )}

        {attempt && (
          <div role="status" className="space-y-1.5">
            <p className={clsx("font-extrabold", right ? "text-good" : "text-bad")}>
              {right ? (
                <>
                  <Check className="inline size-4" strokeWidth={3} aria-hidden /> That&apos;s it.
                </>
              ) : attempt.heard ? (
                <>Heard: “{attempt.heard}”</>
              ) : (
                "Didn't catch that."
              )}
            </p>
            {!right && attempt.check.status === "close" && (
              <p className="text-sm font-bold">
                {attempt.check.missing.length > 0 && <>Missing: {quoted(attempt.check.missing)}. </>}
                {attempt.check.extra.length > 0 && <>Not needed: {quoted(attempt.check.extra)}.</>}
              </p>
            )}
          </div>
        )}

        {done && (
          <div className="space-y-2 rounded-xl bg-elev-2 p-3">
            <div className="flex items-center gap-2">
              <p className="flex-1 text-lg font-extrabold">{answer}</p>
              <button
                type="button"
                onClick={() => hear(answer)}
                aria-label={`Hear "${answer}"`}
                className="grid size-10 shrink-0 place-items-center rounded-full bg-elev hover:bg-accent hover:text-white"
              >
                <Volume2 className="size-4" aria-hidden />
              </button>
            </div>
            {!right && item.trap && !saidTrap && (
              <p className="text-sm text-dim">
                The Hebrew pulls toward <span className="line-through decoration-2">{item.trap}</span>
              </p>
            )}
            {!right && pattern && <p className="text-sm font-bold">{pattern.tip}</p>}
          </div>
        )}

        {typing && !done && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (typed.trim()) judge(typed);
            }}
            className="flex gap-2"
          >
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              aria-label="Your English sentence"
              placeholder="Type it in English"
              autoComplete="off"
              autoCapitalize="sentences"
              className="min-w-0 flex-1 rounded-xl border-2 border-line bg-elev-2 px-3 py-2.5 font-bold outline-none focus:border-accent"
            />
            <button type="submit" className="btn-3d btn-go px-4 text-sm">
              Check
            </button>
          </form>
        )}
      </section>

      {done ? (
        <div className={clsx("grid gap-3", right ? "grid-cols-1" : "grid-cols-2")}>
          {!right && (
            <button
              type="button"
              onClick={() => {
                setAttempt(null);
                setRevealed(false);
                setTyped("");
              }}
              className="btn-3d btn-ghost flex items-center justify-center gap-2 py-3.5"
            >
              <RotateCcw className="size-5" aria-hidden /> Try again
            </button>
          )}
          <button
            type="button"
            onClick={next}
            className="btn-3d btn-go flex items-center justify-center gap-2 py-3.5 uppercase"
          >
            {pos + 1 >= queue.length ? "Finish" : "Next"} <ArrowRight className="size-5" aria-hidden />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => void say()}
            disabled={mic.phase === "opening"}
            className="btn-3d btn-go col-span-3 flex items-center justify-center gap-2 py-3.5"
          >
            {mic.busy ? (
              <MicBusyLabel phase={mic.phase} />
            ) : (
              <>
                <Mic className="size-5" aria-hidden /> Say it
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              cancelMic();
              setTyping((v) => !v);
            }}
            aria-pressed={typing}
            className="btn-3d btn-ghost col-span-1 flex items-center justify-center gap-1.5 py-3 text-sm"
          >
            <Keyboard className="size-4" aria-hidden /> Type
          </button>
          <button
            type="button"
            onClick={show}
            className="btn-3d btn-ghost col-span-2 flex items-center justify-center gap-1.5 py-3 text-sm"
          >
            <Eye className="size-4" aria-hidden /> Show the answer
          </button>
        </div>
      )}
    </div>
  );
}
