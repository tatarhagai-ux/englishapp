"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, Languages } from "lucide-react";
import { HEBREW_PATTERNS, type L1Pattern } from "@/content/l1/he";
import { usePrefs } from "@/lib/client/prefs";

const METHOD = [
  {
    title: "Talk first, fix later",
    body: "During a conversation your tutor repeats your sentence the right way inside the reply, without stopping you. That keeps you talking, which is what builds fluency. The detailed fixes come in the report.",
  },
  {
    title: "Three fixes, not fifteen",
    body: "Each report picks your three most useful mistakes. You say each fix out loud once. Producing the right version yourself is what makes it stick.",
  },
  {
    title: "Mistakes are tracked until they're gone",
    body: "Every mistake has a status: New, then Practicing once you use it correctly, then Mastered after two clean conversations in a row. Make it again and it comes back.",
  },
  {
    title: "Spaced repetition, in days",
    body: "Phrases, words and mistakes return right before you would forget them: a right answer in 3 days, then about two weeks; a miss tomorrow. A mistake you make again while speaking comes back at once.",
  },
  {
    title: "The rule, not one sentence",
    body: "Each time a mistake comes back it's a different sentence with the same pattern, first your own, then prepared ones. Each mistake also has a mini-lesson: the rule, wrong and right, and a drill.",
  },
  {
    title: "Learn, practice, then use",
    body: "On plan days you first meet three of the week's words (hear them, say them), then the conversation gives you chances to use them. Two real uses make a word yours.",
  },
  {
    title: "Recall from meaning",
    body: "Word cards show the meaning and a sentence with a gap; you say the word. Pulling it out of memory is what makes it come to you while speaking. Recognizing it isn't enough.",
  },
  {
    title: "Listening a little above comfortable",
    body: "The listening gym speeds up after three right answers in a row and slows down after a miss, so it stays just hard enough.",
  },
];

/** The plan day on Home is the core; one short extra a day keeps every skill moving. */
const WEEK = [
  { day: "Sun", plan: "Plan day + word cards (5 min)" },
  { day: "Mon", plan: "Plan day + a listening story (4 min)" },
  { day: "Tue", plan: "Plan day + a one-minute talk (4 min)" },
  { day: "Wed", plan: "Plan day + a short read (3 min)" },
  { day: "Thu", plan: "Plan day + a pronunciation unit, record yourself (5 min)" },
  { day: "Fri", plan: "Word cards, and drill your top mistake (5 min)" },
  { day: "Sat", plan: "Rest, or a job interview question if you feel like it" },
];

const TIPS = [
  "Speak out loud, even in quiet mode: read the tutor's reply aloud before typing yours.",
  "Use “I'm stuck” instead of silence. Then say the English version back. That's one new sentence learned.",
  "Answer every part of the question. Interviewers notice when the second half disappears.",
  "Don't wait to feel ready. Ten slightly messy minutes a day beat one perfect hour a week.",
  "Turn captions off once a conversation feels easy. It turns every turn into listening practice.",
];

export function Guide() {
  const [prefs] = usePrefs();
  const grammar = HEBREW_PATTERNS.filter((p) => p.area === "grammar" || p.area === "usage");
  const sound = HEBREW_PATTERNS.filter((p) => p.area === "pronunciation" || p.area === "prosody");

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-2">
        <Link
          href="/settings"
          aria-label="Back to settings"
          className="-ml-2 rounded-full p-2 text-dim hover:text-text"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black tracking-tight">How Speakwise works</h1>
          <p className="text-sm text-dim">The method, a weekly plan, and the mistakes Hebrew speakers make most.</p>
        </div>
      </header>

      <section aria-labelledby="method-title" className="space-y-2.5">
        <h2 id="method-title" className="font-black">
          The method
        </h2>
        <ol className="space-y-2.5">
          {METHOD.map((m, i) => (
            <li key={m.title} className="tile p-4">
              <p className="font-extrabold">
                {i + 1}. {m.title}
              </p>
              <p className="mt-1 text-sm text-dim">{m.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="week-title" className="space-y-2.5">
        <h2 id="week-title" className="font-black">
          A balanced week: the plan day, plus one short extra
        </h2>
        <ul className="tile divide-y-2 divide-line overflow-hidden">
          {WEEK.map((w) => (
            <li key={w.day} className="flex gap-3 px-4 py-2.5 text-sm">
              <span className="w-10 shrink-0 font-black text-accent">{w.day}</span>
              <span className="font-bold">{w.plan}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="grammar-title" className="space-y-2.5">
        <h2 id="grammar-title" className="font-black">
          Grammar and wording traps for Hebrew speakers
        </h2>
        <ul className="space-y-2.5">
          {grammar.map((p) => (
            <PatternCard key={p.key} p={p} showHe={prefs.hebrewHelp} />
          ))}
        </ul>
      </section>

      <section aria-labelledby="sound-title" className="space-y-2.5">
        <h2 id="sound-title" className="font-black">
          Sounds and melody
        </h2>
        <ul className="space-y-2.5">
          {sound.map((p) => (
            <PatternCard key={p.key} p={p} showHe={prefs.hebrewHelp} />
          ))}
        </ul>
      </section>

      <section aria-labelledby="tips-title" className="space-y-2.5">
        <h2 id="tips-title" className="font-black">
          Habits that make the difference
        </h2>
        <ul className="space-y-2">
          {TIPS.map((t) => (
            <li key={t} className="tile p-3 text-sm font-bold">
              {t}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function PatternCard({ p, showHe }: { p: L1Pattern; showHe: boolean }) {
  const [open, setOpen] = useState(showHe);
  return (
    <li className="tile space-y-1.5 p-4">
      <p className="font-extrabold">{p.title}</p>
      {p.example && <p className="text-sm text-bad line-through decoration-bad/60">{p.example}</p>}
      {p.fix && <p className="text-sm font-bold text-good">{p.fix}</p>}
      <p className="text-sm text-dim">{p.tip}</p>
      {open ? (
        <p dir="rtl" lang="he" className="rounded-lg bg-elev-2 px-2.5 py-1.5 text-sm">
          {p.whyHe}
        </p>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1 text-sm font-extrabold text-accent"
        >
          <Languages className="size-4" aria-hidden /> Why (in Hebrew)
        </button>
      )}
      {p.unit && (
        <Link href={`/pronounce/${p.unit}`} className="flex items-center gap-1 text-sm font-extrabold text-accent">
          Practice it <ArrowRight className="size-4" aria-hidden />
        </Link>
      )}
    </li>
  );
}
