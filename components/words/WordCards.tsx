"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Check, ChevronLeft, Eye, Languages, Layers, Mic, Plus, Volume2 } from "lucide-react";
import clsx from "clsx";
import { DECKS, type Deck } from "@/content/decks";
import { learner, useHydrated, useLearner } from "@/lib/client/learner";
import { usePrefs } from "@/lib/client/prefs";
import { useClipPlayer } from "@/lib/client/tts";
import { useMicAttempt } from "@/lib/client/use-mic-attempt";
import { useWakeLock } from "@/lib/client/wake-lock";
import { MicBusyLabel, MicHeard } from "@/components/MicLive";
import { HowItWorks } from "@/components/HowItWorks";
import { KeepGoing } from "@/components/KeepGoing";
import { dayKey } from "@/lib/game/streak";
import { cardQueue, isUnstudied, type CardRating, type PhraseRecord } from "@/lib/learner/model";
import { usedPhrase } from "@/lib/text/compare";
import { blankOut } from "@/lib/text/cloze";

/** "own" = phrases saved from conversations or imported, not from a pack. */
type DeckFilter = string | "all" | "own";

export function WordCards() {
  const hydrated = useHydrated();
  const state = useLearner();
  const [studying, setStudying] = useState<{ queue: PhraseRecord[]; filter: DeckFilter } | null>(null);
  const [lastRound, setLastRound] = useState<number | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const today = dayKey(new Date());

  if (!hydrated) return <p className="text-dim">Loading…</p>;

  function start(filter: DeckFilter) {
    const deck = filter === "all" || filter === "own" ? undefined : filter;
    const { due, fresh } = cardQueue(learner.get(), new Date(), { deck, today });
    const dueList = filter === "own" ? due.filter((p) => !p.deck) : due;
    const freshList = filter === "own" ? [] : fresh;
    // New words mixed in among reviews, so a round isn't all hard or all easy.
    const queue: PhraseRecord[] = [];
    const n = Math.max(dueList.length, freshList.length);
    for (let i = 0; i < n; i++) {
      if (dueList[i]) queue.push(dueList[i]);
      if (freshList[i]) queue.push(freshList[i]);
    }
    if (queue.length) setStudying({ queue, filter });
  }

  if (studying) {
    return (
      <Study
        queue={studying.queue}
        onDone={(n) => {
          setLastRound(n);
          setStudying(null);
        }}
      />
    );
  }

  const all = cardQueue(state, new Date(), { today });
  const added = new Set(state.phrases.map((p) => p.deck).filter(Boolean));
  const own = state.phrases.filter((p) => !p.deck);
  const ownDue = all.due.filter((p) => !p.deck).length;

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
          <h1 className="text-2xl font-black tracking-tight">Word cards</h1>
          <p className="text-sm text-dim">
            See the meaning, find the word, say it. Each card comes back right on time.
          </p>
          <HowItWorks
            steps={[
              "Add a pack (or use the phrases you saved from conversations).",
              "Each card shows a meaning and an example with a gap. Say the word out loud, or think it, then flip.",
              "Rate yourself honestly: Again comes back in this round, Easy waits weeks.",
              "Your tutor then gives you chances to use the words, and two real uses make a word yours.",
            ]}
            why="Pulling a word out of memory from its meaning is what makes it come to you while speaking. Recognizing it isn't enough."
          />
        </div>
      </header>

      {lastRound !== null && lastRound > 0 && (
        <section className="space-y-4">
          <p role="status" className="tile flex items-center gap-2 p-4 font-extrabold text-good">
            <Check className="size-5" aria-hidden /> {lastRound} cards done. They&apos;ll come back right before
            you&apos;d forget them.
          </p>
          <KeepGoing next={null} avoid={[]} />
        </section>
      )}

      <section className="rounded-3xl bg-accent p-5 text-white" style={{ boxShadow: "0 6px 0 var(--accent-deep)" }}>
        <p className="text-xs font-extrabold uppercase tracking-wider opacity-85">Today</p>
        <p className="mt-1 text-2xl font-black">
          {all.due.length} to review · {all.fresh.length} new
        </p>
        <p className="mt-1 text-sm font-bold opacity-90">Up to 10 new words a day, so reviews stay short.</p>
        <button
          type="button"
          onClick={() => start("all")}
          disabled={all.due.length + all.fresh.length === 0}
          className="btn-3d btn-go mt-4 w-full py-3.5 uppercase disabled:opacity-60"
        >
          {all.due.length + all.fresh.length === 0 ? "All done for today" : "Study now"}
        </button>
      </section>

      {(own.length > 0 || added.size > 0) && (
        <section aria-labelledby="mine-title" className="space-y-2.5">
          <h2 id="mine-title" className="font-black">
            Your decks
          </h2>
          {own.length > 0 && (
            <DeckRow
              title="Saved phrases"
              detail={`${own.length} from conversations and imports`}
              due={ownDue}
              learned={own.filter((p) => p.card.reps > 0).length}
              total={own.length}
              onStudy={() => start("own")}
            />
          )}
          {DECKS.filter((d) => added.has(d.id)).map((d) => {
            const words = state.phrases.filter((p) => p.deck === d.id);
            const q = cardQueue(state, new Date(), { deck: d.id, today });
            return (
              <DeckRow
                key={d.id}
                title={d.title}
                detail={d.summary}
                due={q.due.length + q.fresh.length}
                learned={words.filter((p) => !isUnstudied(p)).length}
                total={words.length}
                onStudy={() => start(d.id)}
              />
            );
          })}
        </section>
      )}

      <section aria-labelledby="packs-title" className="space-y-2.5">
        <h2 id="packs-title" className="font-black">
          Add a word pack
        </h2>
        {DECKS.filter((d) => !added.has(d.id)).map((d) => (
          <PackRow
            key={d.id}
            deck={d}
            open={preview === d.id}
            onToggle={() => setPreview(preview === d.id ? null : d.id)}
            onAdd={() => {
              learner.addDeck(d.id);
              setPreview(null);
            }}
          />
        ))}
        {DECKS.every((d) => added.has(d.id)) && (
          <p className="text-sm text-dim">You&apos;ve added every pack. Import your own lists in the phrase bank.</p>
        )}
        <Link href="/phrases" className="block text-sm font-extrabold text-accent">
          Import your own words (a book, a course) in the phrase bank
        </Link>
      </section>
    </div>
  );
}

function DeckRow({
  title,
  detail,
  due,
  learned,
  total,
  onStudy,
}: {
  title: string;
  detail: string;
  due: number;
  learned: number;
  total: number;
  onStudy: () => void;
}) {
  return (
    <div className="tile flex items-center gap-3 p-3.5">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
        <Layers className="size-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-extrabold">{title}</p>
        <p className="truncate text-xs text-dim">{detail}</p>
        <div
          className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-elev-2"
          aria-label={`${learned} of ${total} started`}
        >
          <div className="h-full rounded-full bg-go" style={{ width: `${total ? (learned / total) * 100 : 0}%` }} />
        </div>
      </div>
      <button
        type="button"
        onClick={onStudy}
        disabled={due === 0}
        aria-label={`Study ${title}`}
        className="btn-3d btn-ghost shrink-0 px-3 py-2 text-sm disabled:opacity-50"
      >
        {due > 0 ? `${due} due` : "Done"}
      </button>
    </div>
  );
}

function PackRow({
  deck,
  open,
  onToggle,
  onAdd,
}: {
  deck: Deck;
  open: boolean;
  onToggle: () => void;
  onAdd: () => void;
}) {
  return (
    <div className="tile p-3.5">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onToggle} aria-expanded={open} className="min-w-0 flex-1 text-left">
          <p className="font-extrabold">
            {deck.title} <span className="ml-1 text-xs font-bold text-faint">{deck.level}</span>
          </p>
          <p className="text-xs text-dim">
            {deck.words.length} words · {deck.summary}
          </p>
        </button>
        <button
          type="button"
          onClick={onAdd}
          aria-label={`Add ${deck.title}`}
          className="btn-3d btn-accent flex shrink-0 items-center gap-1 px-3 py-2 text-sm"
        >
          <Plus className="size-4" aria-hidden /> Add
        </button>
      </div>
      {open && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {deck.words.map((w) => (
            <li key={w.text} className="rounded-lg bg-elev-2 px-2 py-1 text-xs font-bold">
              {w.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const RATINGS: { value: CardRating; label: string; tone: string }[] = [
  { value: 1, label: "Again", tone: "text-bad" },
  { value: 2, label: "Hard", tone: "text-warn" },
  { value: 3, label: "Good", tone: "text-good" },
  { value: 4, label: "Easy", tone: "text-accent" },
];

/**
 * One round of cards. Front: the meaning and the example with a gap (recall from meaning).
 * Saying it into the mic checks it; otherwise flip. "Again" brings the card back a few cards
 * later in the same round, once.
 */
function Study({ queue: initial, onDone }: { queue: PhraseRecord[]; onDone: (n: number) => void }) {
  const [prefs] = usePrefs();
  const player = useClipPlayer();
  const mic = useMicAttempt();
  const [queue, setQueue] = useState(initial);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showHe, setShowHe] = useState(prefs.hebrewHelp);
  const [heard, setHeard] = useState<{ text: string; ok: boolean } | null>(null);
  const [requeued, setRequeued] = useState<Set<string>>(new Set());
  const [done, setDone] = useState(0);
  useWakeLock(true);

  const card = queue[index];
  const cloze = useMemo(() => (card?.example ? blankOut(card.example, card.text) : null), [card]);

  useEffect(() => {
    if (!card) onDone(done);
  }, [card, done, onDone]);
  if (!card) return null;

  function hear() {
    void player.play(`card:${card.text}`, card.text, prefs.tutorVoiceId, 0.95);
  }

  async function say() {
    if (mic.busy) return mic.stop();
    try {
      const r = await mic.run(card.text);
      setHeard({ text: r.text, ok: usedPhrase(r.text, card.text) });
      setFlipped(true);
    } catch {
      setHeard({ text: "", ok: false });
    }
  }

  function rate(r: CardRating) {
    learner.ratePhrase(card.text, r);
    let next = queue;
    if (r === 1 && !requeued.has(card.text)) {
      next = [...queue.slice(0, index + 4), card, ...queue.slice(index + 4)];
      setRequeued(new Set(requeued).add(card.text));
      setQueue(next);
    }
    setDone((d) => d + 1);
    setIndex(index + 1);
    setFlipped(false);
    setHeard(null);
    setShowHe(prefs.hebrewHelp);
    player.stop();
  }

  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-faint">
            <Layers className="size-4 text-accent" aria-hidden /> Word cards
            {isUnstudied(card) && <span className="rounded-md bg-xp/20 px-1.5 py-0.5 text-xp">New</span>}
          </p>
          <button
            type="button"
            onClick={() => onDone(done)}
            className="text-sm font-extrabold text-dim hover:text-text"
          >
            Finish
          </button>
        </div>
        <div
          className="h-2.5 overflow-hidden rounded-full bg-elev-2"
          aria-label={`Card ${index + 1} of ${queue.length}`}
        >
          <div className="h-full rounded-full bg-go" style={{ width: `${(index / queue.length) * 100}%` }} />
        </div>
      </header>

      <section className="tile min-h-64 space-y-4 p-5">
        <p className="text-xs font-extrabold uppercase tracking-wider text-faint">
          {flipped ? "The word" : "What's the word?"}
        </p>
        {flipped ? (
          <div className="flex items-center gap-3">
            <p className="flex-1 text-3xl font-black leading-tight">{card.text}</p>
            <button
              type="button"
              onClick={hear}
              aria-label={`Hear "${card.text}"`}
              className="grid size-11 place-items-center rounded-full bg-elev-2 hover:bg-accent hover:text-white"
            >
              <Volume2 className="size-5" aria-hidden />
            </button>
          </div>
        ) : null}
        <p className={clsx("font-bold", flipped ? "text-dim" : "text-xl")}>{card.meaningEn || "No meaning saved"}</p>
        {card.example && (flipped || cloze) && (
          <p className="rounded-xl bg-elev-2 px-3 py-2 italic">{flipped ? card.example : cloze}</p>
        )}
        {card.meaningHe &&
          (showHe ? (
            <p dir="rtl" lang="he" className="text-sm">
              {card.meaningHe}
            </p>
          ) : (
            <button
              type="button"
              onClick={() => setShowHe(true)}
              className="inline-flex items-center gap-1 text-sm font-extrabold text-accent"
            >
              <Languages className="size-4" aria-hidden /> Hebrew
            </button>
          ))}
        {heard && (
          <p className={clsx("text-sm font-bold", heard.ok ? "text-good" : "text-bad")} role="status">
            {heard.ok ? "You said it." : heard.text ? `Heard: “${heard.text}”` : "Didn't catch that."}
          </p>
        )}
        {mic.busy && <MicHeard phase={mic.phase} heard={mic.heard} />}
      </section>

      {!flipped ? (
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => void say()}
            disabled={mic.phase === "opening"}
            className="btn-3d btn-go flex items-center justify-center gap-2 py-3.5"
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
              mic.stop();
              setFlipped(true);
            }}
            className="btn-3d btn-ghost flex items-center justify-center gap-2 py-3.5"
          >
            <Eye className="size-5" aria-hidden /> Show
          </button>
        </div>
      ) : (
        <div role="group" aria-label="How well did you know it?" className="grid grid-cols-4 gap-2">
          {RATINGS.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => rate(r.value)}
              className={clsx("btn-3d btn-ghost py-3 text-sm font-black", r.tone)}
            >
              {r.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
