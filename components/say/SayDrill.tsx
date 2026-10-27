"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  Eye,
  Keyboard,
  Languages,
  Lightbulb,
  Mic,
  RotateCcw,
  Volume2,
} from "lucide-react";
import clsx from "clsx";
import { SAY_MISSES_ID, SAY_SETS, sayMissSet, type SaySet } from "@/content/say";
import { HEBREW_PATTERNS, type L1Pattern } from "@/content/l1/he";
import { learner, useHydrated, useLearner } from "@/lib/client/learner";
import { openSayMisses } from "@/lib/learner/model";
import { usePrefs } from "@/lib/client/prefs";
import { useClipPlayer } from "@/lib/client/tts";
import { useMicAttempt } from "@/lib/client/use-mic-attempt";
import { useWakeLock } from "@/lib/client/wake-lock";
import { checkSay, type SayCheck } from "@/lib/text/say-check";
import { shuffle } from "@/lib/text/shuffle";
import { HowItWorks } from "@/components/HowItWorks";
import { KeepGoing } from "@/components/KeepGoing";
import { MicBusyLabel, MicHeard } from "@/components/MicLive";

function quoted(words: string[]) {
  return words.map((w) => `“${w}”`).join(", ");
}

function patternOf(key: string) {
  return HEBREW_PATTERNS.find((p) => p.key === key);
}

/** Grammar traps first, then word choice and tone. */
const SAY_GROUPS: { id: string; title: string; areas: L1Pattern["area"][] }[] = [
  { id: "grammar", title: "Grammar", areas: ["grammar"] },
  { id: "words", title: "Words and tone", areas: ["usage", "pronunciation", "prosody"] },
];

/** The sets, grouped, with his best score on each and the next one to do marked. */
export function SayList() {
  const hydrated = useHydrated();
  const state = useLearner();
  const misses = hydrated ? openSayMisses(state).length : 0;
  // The first set not done yet, in list order (the same one "Want more?" suggests).
  const nextId = hydrated ? SAY_SETS.find((s) => !state.sayDrills?.[s.id])?.id : undefined;
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
      {misses > 0 && (
        <Link
          href={`/say/${SAY_MISSES_ID}`}
          className="tile flex items-center gap-3 border-accent/50 p-4 transition-colors hover:border-accent"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-white">
            <RotateCcw className="size-5" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-extrabold">Your misses</span>
            <span className="block text-xs font-bold text-dim">
              {misses} {misses === 1 ? "sentence" : "sentences"} to say again, from any set
            </span>
          </span>
          <ArrowRight className="size-5 text-accent" aria-hidden />
        </Link>
      )}
      {SAY_GROUPS.map((group) => {
        const sets = SAY_SETS.filter((s) => group.areas.includes(patternOf(s.pattern)?.area ?? "grammar"));
        return (
          <section key={group.title} aria-labelledby={`say-${group.id}`} className="space-y-2.5">
            <h2 id={`say-${group.id}`} className="font-black">
              {group.title}
            </h2>
            <ul className="space-y-2.5">
              {sets.map((s) => {
                const best = hydrated ? state.sayDrills?.[s.id]?.best : undefined;
                const isNext = s.id === nextId;
                return (
                  <li key={s.id}>
                    <Link
                      href={`/say/${s.id}`}
                      className={clsx(
                        "tile flex items-center gap-3 p-4 transition-colors hover:border-accent/60",
                        isNext && "border-accent/60",
                      )}
                    >
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
                        <Languages className="size-5" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-extrabold">{s.title}</span>
                        <span className="block truncate text-xs font-bold text-dim">
                          {patternOf(s.pattern)?.title} · {s.items.length} sentences
                        </span>
                      </span>
                      <span
                        className={clsx(
                          "text-xs font-black",
                          isNext
                            ? "text-accent"
                            : best === undefined
                              ? "text-faint"
                              : best === s.items.length
                                ? "text-good"
                                : "text-warn",
                        )}
                      >
                        {best !== undefined ? `${best}/${s.items.length}` : isNext ? "Next" : "New"}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
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
export function SayDrill({ set, onRestart }: { set: SaySet; onRestart?: () => void }) {
  const [prefs] = usePrefs();
  const player = useClipPlayer();
  const mic = useMicAttempt();
  const mixed = set.id === SAY_MISSES_ID;
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
  const hinted = useRef(new Set<number>());
  const [hint, setHint] = useState<string[] | null>(null);
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
  // In the mixed round each sentence brings the rule of the set it came from.
  const pattern = patternOf(item?.pattern ?? set.pattern);
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
    // Right with the words in view still helps, but it isn't "on the first try".
    firstAnswer(itemIndex, check.status === "right" && !hinted.current.has(itemIndex));
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

  /** The answer's words, mixed up: he still has to put them in order and say them. */
  function showHint() {
    const words = item.answers[0]
      .replace(/[.?!]$/, "")
      .split(/\s+/)
      // A capital on the first word would give away where to start ("I" and names keep theirs).
      .map((w, i) => (i === 0 && w !== "I" && !w.startsWith("I'") ? w.toLowerCase() : w));
    let mixed = shuffle(words);
    for (let tries = 0; tries < 5 && words.length > 1 && mixed.join(" ") === words.join(" "); tries++) {
      mixed = shuffle(words);
    }
    hinted.current.add(itemIndex);
    setHint(mixed);
  }

  function next() {
    player.stop();
    setHint(null);
    setAttempt(null);
    setRevealed(false);
    setNotice(null);
    setTyped("");
    if (pos + 1 >= queue.length) {
      if (!mixed) learner.recordSayDrill(set.id, firstTry.current.size);
      // Missed on the first try: into the redo round. Right: out of it, if it was there.
      learner.recordSayMisses(
        set.items.filter((_, index) => !firstTry.current.has(index)).map((item) => item.he),
        set.items.filter((_, index) => firstTry.current.has(index)).map((item) => item.he),
      );
      setScore(firstTry.current.size);
      setFinished(true);
      return;
    }
    setPos(pos + 1);
  }

  function restart() {
    // The misses round starts over from what's still missed now, not the old list.
    if (onRestart) return onRestart();
    setQueue(set.items.map((_, i) => i));
    setPos(0);
    firstTry.current = new Set();
    tried.current = new Set();
    hinted.current = new Set();
    setHint(null);
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
            {mixed
              ? score === set.items.length
                ? "All cleared from your misses."
                : `${score} cleared. The rest stay in your misses for next time.`
              : score === set.items.length
                ? "All of them on the first try."
                : score === 0
                  ? "None on the first try yet. That's normal for a trap like this: go again tomorrow."
                  : "Right on the first try. The missed ones got a second go."}
          </p>
          {!mixed && score < set.items.length && (
            <p className="text-sm text-dim">The ones you missed wait in “Your misses” on the list, for another go.</p>
          )}
          {pattern && !mixed && <p className="rounded-xl bg-elev-2 p-3 text-sm font-bold">{pattern.tip}</p>}
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
        {hint && !done && (
          <ul aria-label="Hint: the words, mixed up" className="flex flex-wrap gap-1.5">
            {hint.map((w, i) => (
              <li key={i} className="rounded-lg border-2 border-line bg-elev-2 px-2 py-1 text-sm font-bold">
                {w}
              </li>
            ))}
          </ul>
        )}
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
            className="btn-3d btn-ghost flex items-center justify-center gap-1.5 py-3 text-sm"
          >
            <Keyboard className="size-4" aria-hidden /> Type
          </button>
          <button
            type="button"
            onClick={showHint}
            disabled={!!hint}
            className="btn-3d btn-ghost flex items-center justify-center gap-1.5 py-3 text-sm disabled:opacity-60"
          >
            <Lightbulb className="size-4" aria-hidden /> Hint
          </button>
          <button
            type="button"
            onClick={show}
            aria-label="Show the answer"
            className="btn-3d btn-ghost flex items-center justify-center gap-1.5 py-3 text-sm"
          >
            <Eye className="size-4" aria-hidden /> Answer
          </button>
        </div>
      )}
    </div>
  );
}

/** The mixed round of every sentence still in his misses, taken once when the page opens. */
export function SayMisses() {
  const hydrated = useHydrated();
  const state = useLearner();
  const [set, setSet] = useState<SaySet | null>(null);
  const [round, setRound] = useState(0);
  useEffect(() => {
    if (hydrated && !set) setSet(sayMissSet(openSayMisses(state)));
  }, [hydrated, set, state]);
  function again() {
    setSet(sayMissSet(openSayMisses(learner.get())));
    setRound((r) => r + 1);
  }
  if (!set) return <p className="text-dim">Loading…</p>;
  if (!set.items.length) {
    return (
      <div className="tile space-y-3 p-5 text-center">
        <p className="text-lg font-black">Nothing to redo</p>
        <p className="text-sm text-dim">Sentences you miss in a set land here, so you can say them again later.</p>
        <Link href="/say" className="btn-3d btn-go inline-block px-5 py-3">
          Pick a set
        </Link>
      </div>
    );
  }
  return <SayDrill key={round} set={set} onRestart={again} />;
}
