"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Languages, Mic, Volume2 } from "lucide-react";
import clsx from "clsx";
import type { Analysis } from "@/lib/prompts/analyzer";
import { SpeechSetupError, type PronunciationResult } from "@/lib/client/speech";
import { useMicAttempt } from "@/lib/client/use-mic-attempt";
import { MicBusyLabel, MicHeard } from "@/components/MicLive";
import { useClipPlayer } from "@/lib/client/tts";
import { learner } from "@/lib/client/learner";
import { saidCorrectly } from "@/lib/text/compare";
import { saySetForMistake } from "@/content/say";

interface Props {
  correction: Analysis["corrections"][number];
  sessionId: string;
  fixed: boolean;
  hebrewHelp: boolean;
  voiceId: string;
  dailyGoalMinutes: number;
}

const MIC_ERROR: Record<SpeechSetupError["kind"], string> = {
  not_configured: "Speech isn't connected yet. Finish setup to practice out loud.",
  unauthorized: "Session expired. Reload and unlock again.",
  network: "Couldn't reach the speech service. Try again.",
  mic_denied: "The microphone is blocked. Allow it in the browser settings.",
  unsupported: "This browser can't recognize speech. Chrome, Edge or Safari can.",
  no_speech: "I didn't hear anything. Tap and say it once the red dot shows.",
  unknown: "Couldn't start the microphone. Try again.",
};

function scoreTone(score: number) {
  return score >= 80 ? "text-good" : score >= 60 ? "text-warn" : "text-bad";
}

/**
 * One fix from the report: what he said, the natural version, why, and "Say it again" to
 * produce it out loud (pushed output). Saying it right earns XP and counts toward mastery.
 */
export function CorrectionCard({ correction: c, sessionId, fixed, hebrewHelp, voiceId, dailyGoalMinutes }: Props) {
  const [showHe, setShowHe] = useState(hebrewHelp);
  const [attempt, setAttempt] = useState<{
    status: "idle" | "done" | "error";
    result?: PronunciationResult;
    ok?: boolean;
    error?: string;
  }>({
    status: "idle",
  });
  const player = useClipPlayer();
  const mic = useMicAttempt();

  async function sayIt() {
    if (mic.busy) return mic.stop();
    player.stop();
    setAttempt({ status: "idle" });
    try {
      const result = await mic.run(c.better);
      learner.addSpeechUsage(sessionId, { sttSeconds: result.seconds });
      const ok = saidCorrectly(result.text, c.better);
      if (ok) learner.markFixedAloud(sessionId, c.error_key, dailyGoalMinutes);
      setAttempt({ status: "done", result, ok });
    } catch (err) {
      const kind = err instanceof SpeechSetupError ? err.kind : "unknown";
      setAttempt({ status: "error", error: MIC_ERROR[kind] });
    }
  }

  const playing = player.state?.key === `fix:${c.better}`;
  // The same Hebrew-speaker trap has a "Say it in English" set: six fresh sentences on it.
  const saySet = saySetForMistake(c.error_key);

  return (
    <article className="tile space-y-2 p-4">
      <p className="text-sm text-bad line-through decoration-bad/60">{c.original}</p>
      <p className="text-lg font-extrabold leading-snug text-good">{c.better}</p>
      <p className="text-sm text-dim">{c.why_en}</p>
      {c.why_he &&
        (showHe ? (
          <p dir="rtl" lang="he" className="rounded-lg bg-elev-2 px-2.5 py-1.5 text-sm">
            {c.why_he}
          </p>
        ) : (
          <button
            type="button"
            onClick={() => setShowHe(true)}
            className="inline-flex items-center gap-1 text-sm font-extrabold text-accent tap"
          >
            <Languages className="size-4" aria-hidden /> Translate
          </button>
        ))}

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={() => (playing ? player.stop() : void player.play(`fix:${c.better}`, c.better, voiceId, 0.9))}
          className="btn-3d btn-ghost flex items-center gap-1.5 px-3 py-2 text-sm"
        >
          <Volume2 className="size-4" aria-hidden /> {playing ? "Stop" : "Listen"}
        </button>
        <button
          type="button"
          onClick={() => void sayIt()}
          disabled={mic.waiting}
          className={clsx(
            "btn-3d flex flex-1 items-center justify-center gap-1.5 px-3 py-2 text-sm",
            fixed ? "btn-ghost" : "btn-go",
          )}
        >
          {mic.busy ? (
            <MicBusyLabel phase={mic.phase} />
          ) : fixed ? (
            <>
              <Check className="size-4" strokeWidth={3} aria-hidden /> Fixed! Say it again
            </>
          ) : (
            <>
              <Mic className="size-4" aria-hidden /> Say it out loud
            </>
          )}
        </button>
      </div>

      <MicHeard phase={mic.phase} heard={mic.heard} />
      {saySet && (
        <Link
          href={`/say/${saySet.id}`}
          className="inline-flex items-center gap-1 text-sm font-extrabold text-accent tap"
        >
          <Languages className="size-4" aria-hidden /> Drill this trap from Hebrew: {saySet.title}
        </Link>
      )}
      {attempt.status === "error" && <p className="text-sm font-bold text-bad">{attempt.error}</p>}
      {attempt.status === "done" && attempt.result && (
        <div className="rounded-xl bg-elev-2 p-3" aria-live="polite">
          <p className={clsx("font-extrabold", attempt.ok ? "text-good" : "text-warn")}>
            {attempt.ok ? "Nailed it. +15 XP" : "Close. Try once more, matching the green sentence."}
          </p>
          <p className="mt-1 text-sm text-dim">You said: “{attempt.result.text || "…"}”</p>
          {!attempt.result.scored && (
            <p className="mt-1 text-xs text-faint">Word check only. Sound scores come once Azure is connected.</p>
          )}
          <div
            className={clsx(
              "mt-2 flex-wrap gap-x-4 gap-y-1 text-sm font-bold",
              attempt.result.scored ? "flex" : "hidden",
            )}
          >
            <span>
              Pronunciation{" "}
              <span className={scoreTone(attempt.result.pronunciation)}>
                {Math.round(attempt.result.pronunciation)}
              </span>
            </span>
            <span>
              Fluency <span className={scoreTone(attempt.result.fluency)}>{Math.round(attempt.result.fluency)}</span>
            </span>
            {attempt.result.prosody !== null && (
              <span>
                Intonation{" "}
                <span className={scoreTone(attempt.result.prosody)}>{Math.round(attempt.result.prosody)}</span>
              </span>
            )}
          </div>
          {attempt.result.words.length > 0 && (
            <p className="mt-2 flex flex-wrap gap-1.5" aria-label="Word by word">
              {attempt.result.words.map((w, i) => (
                <span
                  key={i}
                  title={`${Math.round(w.accuracy)}${w.error !== "None" ? ` · ${w.error}` : ""}`}
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
          )}
        </div>
      )}
    </article>
  );
}
