"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Mic, Repeat, Volume2 } from "lucide-react";
import type { StoryLine } from "@/content/stories";
import { speakSequence } from "@/lib/client/tts";
import { primeAudio } from "@/lib/client/speech";
import { useMicAttempt } from "@/lib/client/use-mic-attempt";
import { saidCorrectly } from "@/lib/text/compare";
import { MicBusyLabel, MicHeard } from "@/components/MicLive";

/**
 * Shadowing after a story: each line plays, then he says it the same way (same words, same
 * rhythm) and the mic checks the words. Turning lines he just understood into his own speech.
 */
export function ShadowDrill({ lines, rate }: { lines: StoryLine[]; rate: number }) {
  const [index, setIndex] = useState<number | null>(null);
  const [result, setResult] = useState<{ ok: boolean; heard: string } | null>(null);
  const [matched, setMatched] = useState(0);
  const mic = useMicAttempt();
  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => () => abortRef.current?.abort(), []);

  const line = index === null ? null : lines[index];

  async function hear(i: number) {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    await speakSequence([{ text: lines[i].text, voiceId: lines[i].voice }], rate, { signal: ctrl.signal }).catch(
      () => {},
    );
  }

  function go(i: number) {
    primeAudio();
    setIndex(i);
    setResult(null);
    void hear(i);
  }

  async function say() {
    if (!line) return;
    if (mic.busy) return mic.stop();
    abortRef.current?.abort();
    try {
      const r = await mic.run(line.text);
      const ok = saidCorrectly(r.text, line.text);
      if (ok && !result?.ok) setMatched((m) => m + 1);
      setResult({ ok, heard: r.text });
    } catch {
      setResult({ ok: false, heard: "" });
    }
  }

  if (index === null || !line) {
    return (
      <section aria-labelledby="shadow-title" className="tile space-y-2 p-4">
        <h2 id="shadow-title" className="font-black">
          Shadow it
        </h2>
        <p className="text-sm text-dim">
          Hear each line, then say it the same way: same words, same rhythm. It turns what you understood into what you
          can say.
        </p>
        {matched > 0 && (
          <p role="status" className="text-sm font-bold text-good">
            {matched} of {lines.length} lines said right.
          </p>
        )}
        <button
          type="button"
          onClick={() => {
            setMatched(0);
            go(0);
          }}
          className="btn-3d btn-go flex items-center gap-2 px-4 py-2.5 text-sm"
        >
          <Mic className="size-4" aria-hidden /> {matched > 0 ? "Again" : "Start shadowing"}
        </button>
      </section>
    );
  }

  const last = index + 1 >= lines.length;
  return (
    <section aria-labelledby="shadow-title" className="tile space-y-3 p-4">
      <h2 id="shadow-title" className="flex items-center justify-between font-black">
        Shadow it
        <span className="text-xs font-bold text-dim">
          Line {index + 1} of {lines.length}
        </span>
      </h2>
      <p className="text-xs font-extrabold text-dim">{line.name}</p>
      <p className="text-lg font-bold">{line.text}</p>
      {mic.busy && <MicHeard phase={mic.phase} heard={mic.heard} />}
      {result && (
        <p role="status" className={`text-sm font-bold ${result.ok ? "text-good" : "text-warn"}`}>
          {result.ok ? (
            <>
              <Check className="inline size-4" aria-hidden /> That&apos;s it.
            </>
          ) : result.heard ? (
            `Heard: “${result.heard}”. Listen once more and try again.`
          ) : (
            "Didn't catch that. Try again."
          )}
        </p>
      )}
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => void hear(index)}
          className="btn-3d btn-ghost flex items-center justify-center gap-1.5 py-2.5 text-sm"
        >
          <Volume2 className="size-4" aria-hidden /> Hear
        </button>
        <button
          type="button"
          onClick={() => void say()}
          disabled={mic.phase === "opening"}
          className="btn-3d btn-go flex items-center justify-center gap-1.5 py-2.5 text-sm"
        >
          {mic.busy ? (
            <MicBusyLabel phase={mic.phase} />
          ) : (
            <>
              {result ? <Repeat className="size-4" aria-hidden /> : <Mic className="size-4" aria-hidden />}
              {result ? "Again" : "Say it"}
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => (last ? setIndex(null) : go(index + 1))}
          className="btn-3d btn-ghost flex items-center justify-center gap-1.5 py-2.5 text-sm"
        >
          {last ? "Done" : "Next"} <ArrowRight className="size-4" aria-hidden />
        </button>
      </div>
    </section>
  );
}
