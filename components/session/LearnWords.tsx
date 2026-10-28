"use client";

import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, Languages, Mic, Volume2 } from "lucide-react";
import type { StretchWord } from "@/content/plan";
import { learner } from "@/lib/client/learner";
import { usePrefs } from "@/lib/client/prefs";
import { useClipPlayer } from "@/lib/client/tts";
import { useMicAttempt } from "@/lib/client/use-mic-attempt";
import { usedPhrase } from "@/lib/text/compare";
import { MicBusyLabel, MicHeard } from "@/components/MicLive";

/**
 * Learn before you use (Speak's lesson → practice → conversation): meet a few of the week's
 * words, hear each one in a sentence, say it once, then the conversation gives chances to
 * use them. Meeting a word starts its review schedule (rated "hard": he has only met it).
 */
export function LearnWords({
  words,
  week,
  mode,
  onDone,
}: {
  words: StretchWord[];
  week: number;
  mode: "voice" | "quiet";
  onDone: () => void;
}) {
  const [prefs] = usePrefs();
  const player = useClipPlayer();
  const mic = useMicAttempt();
  const [index, setIndex] = useState(0);
  const [showHe, setShowHe] = useState(prefs.hebrewHelp);
  const [said, setSaid] = useState<boolean | null>(null);
  const word = words[index];

  useEffect(() => {
    // Hear the word as soon as it shows.
    if (word) void player.play(`learn:${word.text}`, word.text, prefs.tutorVoiceId, 0.9);
    // Once per word.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  function next() {
    learner.ratePhrase(word.text, 2);
    player.stop();
    if (index + 1 >= words.length) return onDone();
    setIndex(index + 1);
    setSaid(null);
    setShowHe(prefs.hebrewHelp);
  }

  async function say() {
    if (mic.busy) return mic.stop();
    try {
      const r = await mic.run(word.text);
      setSaid(usedPhrase(r.text, word.text));
    } catch {
      setSaid(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col gap-5 px-4 py-6">
      <header className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-faint">
            <BookOpen className="size-4 text-accent" aria-hidden /> Week {week} words · learn
          </p>
          <button type="button" onClick={onDone} className="text-sm font-extrabold text-dim hover:text-text">
            Skip
          </button>
        </div>
        <div className="flex gap-1.5" aria-label={`Word ${index + 1} of ${words.length}`}>
          {words.map((_, i) => (
            <span key={i} className={`h-2.5 flex-1 rounded-full ${i <= index ? "bg-accent" : "bg-elev-2"}`} />
          ))}
        </div>
      </header>

      <section className="tile space-y-4 p-5">
        <div className="flex items-center gap-3">
          <h2 className="flex-1 text-3xl font-black leading-tight">{word.text}</h2>
          <button
            type="button"
            onClick={() => void player.play(`learn:${word.text}`, word.text, prefs.tutorVoiceId, 0.9)}
            aria-label={`Hear "${word.text}"`}
            className="grid size-11 place-items-center rounded-full bg-elev-2 hover:bg-accent hover:text-white"
          >
            <Volume2 className="size-5" aria-hidden />
          </button>
        </div>
        <p className="font-bold text-dim">{word.meaningEn}</p>
        {showHe ? (
          <p dir="rtl" lang="he" className="text-sm">
            {word.meaningHe}
          </p>
        ) : (
          <button
            type="button"
            onClick={() => setShowHe(true)}
            className="inline-flex items-center gap-1 text-sm font-extrabold text-accent tap"
          >
            <Languages className="size-4" aria-hidden /> Hebrew
          </button>
        )}
        <button
          type="button"
          onClick={() => void player.play(`learn-ex:${word.example}`, word.example, prefs.tutorVoiceId, 0.95)}
          className="flex w-full items-center gap-2 rounded-xl bg-elev-2 px-3 py-2.5 text-left italic"
        >
          <Volume2 className="size-4 shrink-0 text-accent" aria-hidden /> {word.example}
        </button>
        {said !== null && (
          <p role="status" className={`text-sm font-bold ${said ? "text-good" : "text-warn"}`}>
            {said ? "Nice, that's it." : "Close enough to move on. You'll hear it again in the conversation."}
          </p>
        )}
        {mic.busy && <MicHeard phase={mic.phase} heard={mic.heard} />}
      </section>

      <div className="mt-auto grid grid-cols-2 gap-3">
        {mode === "voice" ? (
          <button
            type="button"
            onClick={() => void say()}
            disabled={mic.waiting}
            className="btn-3d btn-ghost flex items-center justify-center gap-2 py-3.5"
          >
            {mic.busy ? (
              <MicBusyLabel phase={mic.phase} />
            ) : (
              <>
                <Mic className="size-5" aria-hidden /> Say it
              </>
            )}
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={next}
          className="btn-3d btn-go flex items-center justify-center gap-2 py-3.5 uppercase"
        >
          {index + 1 >= words.length ? "Start talking" : "Next"} <ArrowRight className="size-5" aria-hidden />
        </button>
      </div>
    </div>
  );
}
