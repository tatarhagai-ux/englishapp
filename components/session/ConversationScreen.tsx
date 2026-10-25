"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Captions,
  CaptionsOff,
  Keyboard,
  Lightbulb,
  LifeBuoy,
  Mic,
  MicOff,
  Repeat,
  Send,
  Snail,
  Sparkles,
  X,
} from "lucide-react";
import clsx from "clsx";
import { scenarioById } from "@/content/scenarios";
import { voiceById, DEFAULT_TUTOR_VOICE_ID } from "@/content/voices";
import type { Turn, TurnInput } from "@/lib/conversation/types";
import { usePrefs } from "@/lib/client/prefs";
import { learner, useHydrated, useLearner } from "@/lib/client/learner";
import { ApiError, API_ERROR_TEXT, assist, streamChat } from "@/lib/client/api";
import { ensureMicrophone, Listener, primeAudio, SpeechQueue, SpeechSetupError } from "@/lib/client/speech";
import { SentenceChunker } from "@/lib/text/sentences";
import { wordCount } from "@/lib/text/compare";
import { usageCostUsd } from "@/lib/cost/pricing";
import { monthKey } from "@/lib/cost/budget";
import { targetKeysForNext, warmupItems, type WarmupItem } from "@/lib/learner/model";
import { Intro } from "./Intro";
import { Warmup } from "./Warmup";
import { Transcript } from "./Transcript";
import { HelperPanel, type HelperState } from "./HelperPanel";
import { Orb, type OrbState } from "./Orb";

const SPEECH_ERROR_TEXT: Record<SpeechSetupError["kind"], string> = {
  not_configured: "Speech isn't connected yet (Azure). Finish setup, or use quiet mode.",
  unauthorized: "Your session expired. Reload and unlock again.",
  network: "Lost the connection to the speech service. Tap the mic to try again.",
  mic_denied: "The microphone is blocked. Allow it in the browser settings, or use quiet mode.",
  unknown: "The microphone couldn't start. Tap to try again, or use quiet mode.",
};

/** Typed (quiet mode) turns have no audio duration; estimate from a relaxed 130 words a minute. */
const typedSeconds = (text: string) => Math.round((wordCount(text) / 130) * 60);

interface Props {
  scenarioId: string;
  budgetUsd: number;
}

export function ConversationScreen({ scenarioId, budgetUsd }: Props) {
  const scenario = scenarioById(scenarioId)!;
  const router = useRouter();
  const hydrated = useHydrated();
  const state = useLearner();
  const [prefs] = usePrefs();

  const isTutor = scenario.voiceId === null;
  const voice = voiceById(scenario.voiceId ?? prefs.tutorVoiceId) ?? voiceById(DEFAULT_TUTOR_VOICE_ID)!;
  const tutorName = voiceById(prefs.tutorVoiceId)?.displayName ?? "Ava";
  const limitSeconds = (isTutor ? prefs.sessionMinutes : scenario.minutes) * 60;
  const spentThisMonth = state.spend[monthKey()] ?? 0;

  const [phase, setPhase] = useState<"intro" | "warmup" | "live" | "finishing">("intro");
  const [warmup, setWarmup] = useState<WarmupItem[]>([]);
  const [mode, setMode] = useState<"voice" | "quiet">("voice");
  const [starting, setStarting] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [orb, setOrb] = useState<OrbState>("idle");
  const [partial, setPartial] = useState("");
  const [pendingTutor, setPendingTutor] = useState("");
  const [handsFree, setHandsFree] = useState(true);
  const [stuckNext, setStuckNext] = useState(false);
  const [hideText, setHideText] = useState(false);
  const [helper, setHelper] = useState<HelperState | null>(null);
  const [error, setError] = useState<{ message: string; retry?: () => void } | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [draft, setDraft] = useState("");

  const turnsRef = useRef<Turn[]>([]);
  const sessionRef = useRef<string | null>(null);
  const modeRef = useRef(mode);
  const handsFreeRef = useRef(handsFree);
  const endedRef = useRef(false);
  const wrapSentRef = useRef(false);
  const elapsedRef = useRef(0);
  const pttBuffer = useRef<{ text: string; seconds: number }>({ text: "", seconds: 0 });
  const listenerRef = useRef<Listener | null>(null);
  const queueRef = useRef<SpeechQueue | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  /** True while a tutor reply is still streaming, so the audio queue going idle isn't "done". */
  const pendingRef = useRef(false);
  const rateRef = useRef(prefs.speechRate);
  rateRef.current = prefs.speechRate;
  modeRef.current = mode;
  handsFreeRef.current = handsFree;

  // An unfinished conversation for this scenario from the last two hours can be resumed.
  const resumable = useMemo(() => {
    if (!hydrated) return null;
    const cutoff = Date.now() - 2 * 60 * 60 * 1000;
    return (
      state.sessions
        .filter((s) => s.scenarioId === scenarioId && !s.endedAt && new Date(s.startedAt).getTime() > cutoff)
        .find((s) => s.turns.some((t) => t.role === "learner")) ?? null
    );
  }, [hydrated, state.sessions, scenarioId]);

  const setTurnsBoth = useCallback((next: Turn[]) => {
    turnsRef.current = next;
    setTurns(next);
  }, []);

  const addCost = useCallback((usd: number) => learner.addSpend(sessionRef.current, usd), []);

  // Speech ---------------------------------------------------------------------------------

  const stopListening = useCallback(async () => {
    const l = listenerRef.current;
    listenerRef.current = null;
    setPartial("");
    if (l) await l.stop();
  }, []);

  const finish = useCallback(async () => {
    endedRef.current = true;
    abortRef.current?.abort();
    queueRef.current?.stop();
    await stopListening();
    const id = sessionRef.current;
    if (!id) return router.push("/practice");
    if (!turnsRef.current.some((t) => t.role === "learner")) {
      learner.discardSession(id);
      return router.push("/practice");
    }
    learner.finishSession(id);
    setPhase("finishing");
    router.push(`/report/${id}`);
  }, [router, stopListening]);

  const requestTutorRef = useRef<() => Promise<void>>(async () => {});

  const submitLearner = useCallback(
    async (text: string, seconds: number, input: TurnInput) => {
      const clean = text.trim();
      if (!clean || endedRef.current) return;
      await stopListening();
      setStuckNext(false);
      setHelper(null);
      const turn: Turn = { role: "learner", text: clean, input };
      setTurnsBoth([...turnsRef.current, turn]);
      if (sessionRef.current) {
        learner.appendTurn(sessionRef.current, turn, Math.round(seconds));
        if (input !== "text") learner.addSpeechUsage(sessionRef.current, { sttSeconds: seconds });
      }
      await requestTutorRef.current();
    },
    [setTurnsBoth, stopListening],
  );

  const startListening = useCallback(
    async (language: "en-US" | "he-IL" = "en-US") => {
      if (endedRef.current || modeRef.current !== "voice") return;
      await stopListening();
      setError(null);
      pttBuffer.current = { text: "", seconds: 0 };
      const listener = new Listener(language, language === "he-IL" ? 1500 : 1200);
      listenerRef.current = listener;
      setOrb("listening");
      const stuck = language === "he-IL";
      try {
        await listener.start({
          onPartial: (t) => setPartial(t),
          onFinal: (t, secs) => {
            // Hands-free (and Hebrew "stuck" turns) end on the first pause; push-to-talk collects until stopped.
            if (handsFreeRef.current || stuck) {
              void submitLearner(t, secs, stuck ? "stuck" : "voice");
            } else {
              pttBuffer.current = {
                text: `${pttBuffer.current.text} ${t}`.trim(),
                seconds: pttBuffer.current.seconds + secs,
              };
              setPartial(pttBuffer.current.text);
            }
          },
          onError: (err) => {
            setOrb("idle");
            setError({ message: SPEECH_ERROR_TEXT[err.kind] });
          },
        });
      } catch (err) {
        listenerRef.current = null;
        setOrb("idle");
        const kind = err instanceof SpeechSetupError ? err.kind : "unknown";
        setError({ message: SPEECH_ERROR_TEXT[kind] });
      }
    },
    [stopListening, submitLearner],
  );

  const afterTutorSpoke = useCallback(() => {
    if (endedRef.current) return;
    if (wrapSentRef.current && !pendingRef.current) {
      void finish();
      return;
    }
    if (modeRef.current === "voice" && handsFreeRef.current) void startListening();
    else setOrb("idle");
  }, [finish, startListening]);

  const ensureQueue = useCallback(() => {
    queueRef.current ??= new SpeechQueue({
      voiceId: voice.id,
      getRate: () => rateRef.current,
      onStart: () => setOrb("speaking"),
      onIdle: () => {
        if (!pendingRef.current) afterTutorSpoke();
      },
      onChars: (chars) => learner.addSpeechUsage(sessionRef.current, { ttsChars: chars }),
    });
    return queueRef.current;
  }, [voice.id, afterTutorSpoke]);

  // Tutor ----------------------------------------------------------------------------------

  const requestTutor = useCallback(async () => {
    if (endedRef.current) return;
    const queue = ensureQueue();
    const wrapUp = elapsedRef.current >= limitSeconds;
    if (wrapUp) wrapSentRef.current = true;
    setOrb("thinking");
    setError(null);
    pendingRef.current = true;
    const chunker = new SentenceChunker();
    let shown = "";
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const res = await streamChat(
        {
          scenarioId,
          history: turnsRef.current,
          correctionMode: prefs.correctionMode,
          targetKeys: targetKeysForNext(learner.get()),
          tutorName,
          wrapUp,
        },
        (delta) => {
          shown += delta;
          setPendingTutor(shown);
          for (const sentence of chunker.push(delta)) queue.speak(sentence);
        },
        ctrl.signal,
      );
      for (const rest of chunker.flush()) queue.speak(rest);
      const turn: Turn = { role: "tutor", text: res.text };
      setPendingTutor("");
      setTurnsBoth([...turnsRef.current, turn]);
      if (sessionRef.current) learner.appendTurn(sessionRef.current, turn);
      addCost(usageCostUsd(res.model, res.usage));
      pendingRef.current = false;
      // If the audio already finished (or failed), move on now; otherwise onIdle will.
      if (!queue.busy) afterTutorSpoke();
    } catch (err) {
      pendingRef.current = false;
      setPendingTutor("");
      queue.stop();
      if (err instanceof DOMException && err.name === "AbortError") return;
      wrapSentRef.current = false;
      setOrb("idle");
      const kind = err instanceof ApiError ? err.kind : "provider";
      setError({ message: API_ERROR_TEXT[kind], retry: () => void requestTutorRef.current() });
    }
  }, [ensureQueue, limitSeconds, scenarioId, prefs.correctionMode, tutorName, setTurnsBoth, addCost, afterTutorSpoke]);

  requestTutorRef.current = requestTutor;

  // Lifecycle ------------------------------------------------------------------------------

  useEffect(() => {
    if (phase !== "live") return;
    const t = setInterval(() => {
      elapsedRef.current += 1;
      setElapsed(elapsedRef.current);
    }, 1000);
    return () => clearInterval(t);
  }, [phase]);

  useEffect(
    () => () => {
      abortRef.current?.abort();
      queueRef.current?.stop();
      void listenerRef.current?.stop();
    },
    [],
  );

  const blockedReason =
    hydrated && spentThisMonth >= budgetUsd
      ? `This month's spending cap ($${budgetUsd}) is reached. Raise MONTHLY_BUDGET_USD in Vercel to keep going.`
      : null;

  async function begin(resume: boolean) {
    primeAudio();
    setStarting(true);
    let chosen = mode;
    if (chosen === "voice") {
      try {
        await ensureMicrophone();
      } catch {
        chosen = "quiet";
        setMode("quiet");
        setError({ message: SPEECH_ERROR_TEXT.mic_denied + " Switched to quiet mode." });
      }
    }
    modeRef.current = chosen;
    let id: string;
    if (resume && resumable) {
      id = resumable.id;
      setTurnsBoth(resumable.turns);
      elapsedRef.current = Math.min(resumable.speakingSeconds * 2, limitSeconds - 60);
    } else {
      id = learner.startSession(scenarioId, chosen, scenario.opener);
      setTurnsBoth([{ role: "tutor", text: scenario.opener }]);
    }
    sessionRef.current = id;
    setSessionId(id);
    setStarting(false);
    const items = resume ? [] : warmupItems(learner.get());
    if (items.length) {
      setWarmup(items);
      setPhase("warmup");
      return;
    }
    startConversation();
  }

  function startConversation() {
    primeAudio();
    setPhase("live");
    const last = turnsRef.current.at(-1);
    if (last?.role === "tutor") ensureQueue().speak(last.text);
    else void requestTutorRef.current();
  }

  // Helpers --------------------------------------------------------------------------------

  const lastTutor = [...turns].reverse().find((t) => t.role === "tutor")?.text ?? "";
  const lastLearner = [...turns].reverse().find((t) => t.role === "learner" && t.input !== "stuck")?.text ?? "";
  const busy = orb === "thinking" || orb === "speaking";

  async function replay(rate: number) {
    if (!lastTutor || busy) return;
    await stopListening();
    const previous = rateRef.current;
    rateRef.current = rate;
    ensureQueue().speak(lastTutor);
    rateRef.current = previous;
  }

  async function runAssist(kind: "hint" | "better" | "simplify") {
    setHelper({
      kind: "loading",
      title: kind === "hint" ? "Finding ideas…" : kind === "better" ? "Rephrasing…" : "Simplifying…",
    });
    try {
      if (kind === "hint") {
        const r = await assist({ mode: "hint", history: turnsRef.current, task: scenario.task });
        addCost(usageCostUsd(r.model, r.usage));
        setHelper({ kind: "hint", ideas: r.ideas });
      } else if (kind === "better") {
        const r = await assist({ mode: "better", text: lastLearner });
        addCost(usageCostUsd(r.model, r.usage));
        setHelper({ kind: "better", original: lastLearner, better: r.better, why: r.why_en, whyHe: r.why_he });
      } else {
        const r = await assist({ mode: "simplify", text: lastTutor });
        addCost(usageCostUsd(r.model, r.usage));
        setHelper({ kind: "simplify", simple: r.simple, hebrew: r.hebrew });
      }
    } catch (err) {
      const k = err instanceof ApiError ? err.kind : "provider";
      setHelper({ kind: "error", message: API_ERROR_TEXT[k] });
    }
  }

  async function onStuck() {
    if (busy) return;
    if (mode === "voice") {
      setStuckNext(true);
      await startListening("he-IL");
    } else {
      setStuckNext((v) => !v);
    }
  }

  /** Barge-in: talking or typing while the other side speaks cuts the audio short. */
  function interrupt() {
    if (orb === "speaking") queueRef.current?.stop();
  }

  async function onMic() {
    if (orb === "thinking" || endedRef.current) return;
    interrupt();
    if (orb === "listening") {
      if (!handsFree && pttBuffer.current.text) {
        const { text, seconds } = pttBuffer.current;
        pttBuffer.current = { text: "", seconds: 0 };
        await submitLearner(text, seconds, "voice");
      } else {
        await stopListening();
        setOrb("idle");
      }
      return;
    }
    await startListening();
  }

  function sendTyped(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || orb === "thinking") return;
    interrupt();
    setDraft("");
    void submitLearner(text, stuckNext ? 0 : typedSeconds(text), stuckNext ? "stuck" : "text");
  }

  async function switchMode() {
    const next = mode === "voice" ? "quiet" : "voice";
    if (next === "voice") {
      try {
        await ensureMicrophone();
      } catch {
        setError({ message: SPEECH_ERROR_TEXT.mic_denied });
        return;
      }
    } else {
      await stopListening();
      if (!busy) setOrb("idle");
    }
    setMode(next);
    modeRef.current = next;
    if (next === "voice" && !busy && handsFree) void startListening();
  }

  // Render ---------------------------------------------------------------------------------

  if (phase === "intro") {
    return (
      <Intro
        scenario={scenario}
        voice={voice}
        isTutor={isTutor}
        mode={mode}
        onMode={setMode}
        onStart={() => void begin(false)}
        onResume={resumable ? () => void begin(true) : undefined}
        blockedReason={blockedReason}
        starting={starting}
        warmupCount={hydrated ? warmupItems(state).length : 0}
      />
    );
  }

  if (phase === "warmup" && sessionId) {
    return (
      <Warmup
        items={warmup}
        mode={mode}
        sessionId={sessionId}
        hebrewHelp={prefs.hebrewHelp}
        onDone={startConversation}
      />
    );
  }

  const minutes = Math.floor(elapsed / 60);
  const seconds = String(elapsed % 60).padStart(2, "0");
  const progress = Math.min(1, elapsed / limitSeconds);

  return (
    <div className="mx-auto flex h-dvh max-w-xl flex-col">
      <header className="flex items-center gap-3 px-4 pb-2 pt-4">
        <button
          type="button"
          onClick={() => void finish()}
          aria-label="End conversation"
          className="grid size-10 place-items-center rounded-xl border-2 border-line bg-elev text-dim hover:text-text"
        >
          <X className="size-5" />
        </button>
        <Orb state={orb} size={36} showLabel={false} />
        <div className="flex-1">
          <div className="flex items-baseline justify-between">
            <p className="font-extrabold">{voice.displayName}</p>
            <p className="font-mono text-xs text-dim" aria-label="Elapsed time">
              {minutes}:{seconds}
            </p>
          </div>
          <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-elev-2" aria-hidden>
            <div
              className="h-full rounded-full bg-go transition-[width] duration-1000"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={() => setHideText((v) => !v)}
          aria-pressed={hideText}
          aria-label={hideText ? "Show their text" : "Hide their text (listening practice)"}
          className="grid size-10 place-items-center rounded-xl border-2 border-line bg-elev text-dim hover:text-text"
        >
          {hideText ? <CaptionsOff className="size-5" /> : <Captions className="size-5" />}
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-3">
        <Transcript
          turns={turns}
          speakerName={voice.displayName}
          pendingTutor={pendingTutor}
          partial={partial}
          hideTutorText={hideText}
        />
      </main>

      {error && (
        <div
          role="alert"
          className="mx-4 mb-2 flex items-center gap-3 rounded-xl bg-bad/10 p-3 text-sm font-bold text-bad"
        >
          <span className="flex-1">{error.message}</span>
          {error.retry && (
            <button type="button" onClick={error.retry} className="btn-3d btn-ghost px-3 py-1.5 text-xs">
              Retry
            </button>
          )}
          {error.message.includes("setup") && (
            <Link href="/setup" className="font-extrabold text-accent">
              Setup
            </Link>
          )}
        </div>
      )}

      {helper && <HelperPanel state={helper} hebrewHelp={prefs.hebrewHelp} onClose={() => setHelper(null)} />}

      <div className="flex gap-2 overflow-x-auto px-4 pb-3" role="toolbar" aria-label="Conversation help">
        <Chip
          icon={LifeBuoy}
          label={stuckNext ? "Say it in Hebrew…" : "I'm stuck"}
          onClick={() => void onStuck()}
          active={stuckNext}
          disabled={busy}
        />
        <Chip icon={Snail} label="Slower" onClick={() => void replay(0.75)} disabled={busy || !lastTutor} />
        <Chip icon={Repeat} label="Repeat" onClick={() => void replay(rateRef.current)} disabled={busy || !lastTutor} />
        <Chip icon={Lightbulb} label="Hint" onClick={() => void runAssist("hint")} disabled={busy} />
        <Chip
          icon={Sparkles}
          label="Say it better"
          onClick={() => void runAssist("better")}
          disabled={busy || !lastLearner}
        />
        <Chip label="What did they say?" onClick={() => void runAssist("simplify")} disabled={busy || !lastTutor} />
      </div>

      <footer className="border-t-2 border-line px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        {mode === "voice" ? (
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => void switchMode()}
              className="flex flex-col items-center gap-1 text-[11px] font-extrabold text-dim"
            >
              <span className="grid size-11 place-items-center rounded-xl border-2 border-line bg-elev">
                <Keyboard className="size-5" aria-hidden />
              </span>
              Type
            </button>
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={() => void onMic()}
                disabled={orb === "thinking"}
                aria-label={orb === "listening" ? (handsFree ? "Pause listening" : "Send") : "Start talking"}
                className={clsx(
                  "btn-3d grid size-20 place-items-center rounded-[1.75rem] disabled:opacity-60",
                  orb === "listening" ? "btn-accent" : "btn-go",
                )}
              >
                {orb === "listening" && !handsFree ? (
                  <Send className="size-8" />
                ) : orb === "listening" ? (
                  <MicOff className="size-8" />
                ) : (
                  <Mic className="size-8" />
                )}
              </button>
            </div>
            <button
              type="button"
              onClick={() => setHandsFree((v) => !v)}
              aria-pressed={handsFree}
              className="flex flex-col items-center gap-1 text-[11px] font-extrabold text-dim"
            >
              <span
                className={clsx(
                  "grid size-11 place-items-center rounded-xl border-2",
                  handsFree ? "border-accent bg-accent-soft text-accent" : "border-line bg-elev",
                )}
              >
                <Mic className="size-5" aria-hidden />
              </span>
              {handsFree ? "Hands-free" : "Tap to send"}
            </button>
          </div>
        ) : (
          <form onSubmit={sendTyped} className="flex items-end gap-2">
            <button
              type="button"
              onClick={() => void switchMode()}
              aria-label="Switch to speaking"
              className="grid size-12 shrink-0 place-items-center rounded-xl border-2 border-line bg-elev text-dim"
            >
              <Mic className="size-5" />
            </button>
            <label htmlFor="typed" className="sr-only">
              {stuckNext ? "Write it in Hebrew" : "Your reply"}
            </label>
            <textarea
              id="typed"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) sendTyped(e);
              }}
              dir={stuckNext ? "rtl" : "auto"}
              lang={stuckNext ? "he" : "en"}
              rows={1}
              placeholder={stuckNext ? "כתוב בעברית מה רצית להגיד" : "Type your reply…"}
              className="max-h-32 min-h-12 flex-1 resize-none rounded-xl border-2 border-line bg-elev-2 px-3 py-3 outline-none focus:border-accent"
            />
            <button
              type="submit"
              disabled={orb === "thinking" || !draft.trim()}
              aria-label="Send"
              className="btn-3d btn-go grid size-12 shrink-0 place-items-center disabled:opacity-50"
            >
              <Send className="size-5" />
            </button>
          </form>
        )}
        <p className="mt-2 text-center text-xs font-bold text-faint">
          {orb === "listening"
            ? stuckNext
              ? "Say it in Hebrew. You'll get the English to repeat."
              : handsFree
                ? "Listening. Pause for a moment when you're done."
                : "Listening. Tap send when you're done."
            : orb === "thinking"
              ? `${voice.displayName} is thinking…`
              : orb === "speaking"
                ? `${voice.displayName} is talking…`
                : mode === "voice"
                  ? "Tap the mic to talk."
                  : "Quiet mode: type, and listen to the reply."}
        </p>
        {sessionId && elapsed >= limitSeconds && !wrapSentRef.current && (
          <p className="mt-1 text-center text-xs font-extrabold text-accent">
            Time&apos;s up after this reply. Nice work.
          </p>
        )}
      </footer>
    </div>
  );
}

function Chip({
  icon: Icon,
  label,
  onClick,
  disabled,
  active,
}: {
  icon?: typeof Mic;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "btn-3d flex shrink-0 items-center gap-1.5 px-3 py-2 text-sm disabled:opacity-50",
        active ? "btn-accent" : "btn-ghost",
      )}
    >
      {Icon && <Icon className="size-4" aria-hidden />}
      {label}
    </button>
  );
}
