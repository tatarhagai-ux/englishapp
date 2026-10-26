"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Brain,
  Check,
  Circle,
  Clock,
  Gauge,
  Languages,
  LifeBuoy,
  Loader2,
  MessageCircle,
  RotateCcw,
  Sparkles,
  Trophy,
} from "lucide-react";
import clsx from "clsx";
import { scenarioById } from "@/content/scenarios";
import { useHydrated, useLearner, learner } from "@/lib/client/learner";
import { usePrefs } from "@/lib/client/prefs";
import { analyzeSession, ApiError, API_ERROR_TEXT } from "@/lib/client/api";
import { usageCostUsd } from "@/lib/cost/pricing";
import { criterionMet, wordCount } from "@/lib/text/compare";
import { planDayByKey, planWeek } from "@/content/plan";
import { planPosition } from "@/lib/learner/plan";
import { phraseUsedIn, recommendScenario } from "@/lib/learner/model";
import { CorrectionCard } from "./CorrectionCard";
import { InterviewCard } from "./InterviewCard";
import { demoAnalysis } from "@/lib/client/demo";
import { KeepGoing } from "@/components/KeepGoing";

export function ReportScreen({ sessionId }: { sessionId: string }) {
  const hydrated = useHydrated();
  const state = useLearner();
  const [prefs] = usePrefs();
  const session = state.sessions.find((s) => s.id === sessionId);
  const scenario = session ? scenarioById(session.scenarioId) : undefined;
  const [status, setStatus] = useState<"idle" | "analyzing" | "error">("idle");
  const [errorText, setErrorText] = useState("");
  const started = useRef(false);

  async function analyze() {
    if (!session) return;
    if (session.demo && scenario) {
      learner.saveDemoReport(session.id, demoAnalysis(scenario, session.turns));
      return;
    }
    setStatus("analyzing");
    try {
      const res = await analyzeSession(session.scenarioId, session.turns);
      learner.addSpend(session.id, usageCostUsd(res.model, res.usage));
      learner.saveReport(session.id, res.analysis, prefs.dailyGoalMinutes);
      setStatus("idle");
    } catch (err) {
      setErrorText(API_ERROR_TEXT[err instanceof ApiError ? err.kind : "provider"]);
      setStatus("error");
    }
  }

  useEffect(() => {
    if (!hydrated || !session || session.report || started.current) return;
    started.current = true;
    void analyze();
    // Run once per mount when the report is missing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, session?.id, session?.report]);

  if (!hydrated)
    return (
      <Shell>
        <p className="text-dim">Loading…</p>
      </Shell>
    );
  if (!session || !scenario) {
    return (
      <Shell>
        <p className="font-bold">This report isn&apos;t on this device.</p>
        <Link href="/" className="btn-3d btn-go mt-4 inline-block px-5 py-3">
          Home
        </Link>
      </Shell>
    );
  }

  const report = session.report;
  const learnerTurns = session.turns.filter((t) => t.role === "learner");
  const englishTurns = learnerTurns.filter((t) => t.input !== "stuck");
  const words = englishTurns.reduce((n, t) => n + wordCount(t.text), 0);
  const voiceSeconds = session.speakingSeconds;
  const wpm = session.mode === "voice" && voiceSeconds > 20 ? Math.round(words / (voiceSeconds / 60)) : null;
  // Chosen after this report is saved, so it already reflects today's mistakes. A plan day
  // leads to the next plan day instead.
  const planNext = session.planDay ? planPosition(state, session.day).next : null;
  const next = planNext ? scenarioById(planNext.scenarioId)! : recommendScenario(state);
  const nextHref = planNext ? `/session/${planNext.scenarioId}?plan=${planNext.key}` : `/session/${next.id}`;
  // This week's words he used in this conversation.
  const week = session.planDay ? planWeek(planDayByKey(session.planDay)?.week ?? 0) : undefined;
  const said = englishTurns.map((t) => t.text).join(" ");
  const wordsUsed = week ? week.words.filter((w) => phraseUsedIn(said, w.text)) : [];
  const isMet = (c: string) => criterionMet(report?.task.met ?? [], c);

  return (
    <Shell>
      <header>
        <p className="text-xs font-extrabold uppercase tracking-wider text-faint">Session report</p>
        <h1 className="text-2xl font-black leading-tight">{scenario.title}</h1>
      </header>

      {session.demo && (
        <p role="note" className="rounded-xl border-2 border-xp/50 bg-xp/10 p-3 text-sm font-bold">
          Sample report from the demo. Once the AI key is connected, every fix and score here comes from what you
          actually said. Demo conversations don&apos;t count toward your progress.
        </p>
      )}

      {status === "analyzing" && (
        <section className="tile flex items-center gap-3 p-5" aria-live="polite">
          <Loader2 className="size-6 animate-spin text-accent" aria-hidden />
          <div>
            <p className="font-extrabold">Reviewing your conversation…</p>
            <p className="text-sm text-dim">Finding your 3 most useful fixes. About 10 seconds.</p>
          </div>
        </section>
      )}
      {status === "error" && (
        <section role="alert" className="tile space-y-3 border-bad/40 p-5">
          <p className="font-bold text-bad">{errorText}</p>
          <button type="button" onClick={() => void analyze()} className="btn-3d btn-ghost px-4 py-2 text-sm">
            Try again
          </button>
        </section>
      )}

      {report && (
        <>
          <section
            className={clsx("rounded-3xl p-5", report.task.completed ? "bg-go text-go-ink" : "bg-warn/15 text-text")}
            style={report.task.completed ? { boxShadow: "0 6px 0 var(--go-deep)" } : undefined}
          >
            <p className="flex items-center gap-2 text-lg font-black">
              {report.task.completed ? (
                <Trophy className="size-6" aria-hidden />
              ) : (
                <Circle className="size-5" aria-hidden />
              )}
              {report.task.completed ? "Mission complete!" : "Mission not finished yet"}
            </p>
            <ul className="mt-3 space-y-1 text-sm font-bold">
              {scenario.successCriteria.map((c) => (
                <li key={c} className="flex gap-2">
                  {isMet(c) ? (
                    <Check className="size-4 shrink-0" strokeWidth={3} aria-label="Met" />
                  ) : (
                    <Circle className="size-4 shrink-0 opacity-60" aria-label="Not yet" />
                  )}
                  {c}
                </li>
              ))}
            </ul>
            {report.task.feedback_en && <p className="mt-3 text-sm font-bold opacity-90">{report.task.feedback_en}</p>}
          </section>

          <div className="flex items-center justify-between gap-3">
            {report.praise_en && (
              <p className="tile flex-1 p-3 text-sm">
                <span className="font-extrabold text-good">Nice: </span>
                {report.praise_en}
              </p>
            )}
            {!session.demo && (
              <span
                className="shrink-0 rounded-2xl bg-xp px-4 py-3 text-lg font-black text-[#3a2a00]"
                aria-label={`${session.xp} XP earned`}
              >
                +{session.xp} XP
              </span>
            )}
          </div>

          {!session.demo && (report.memory?.length ?? 0) > 0 && (
            <p className="flex gap-2 rounded-xl bg-elev-2 p-3 text-sm">
              <Brain className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
              <span>
                <span className="font-extrabold">Your tutor will remember: </span>
                {report.memory?.join(" ")}{" "}
                <Link href="/settings#memory" className="font-bold text-accent">
                  Manage
                </Link>
              </span>
            </p>
          )}

          <section aria-labelledby="fixes-title" className="space-y-3">
            <h2 id="fixes-title" className="font-black">
              {report.corrections.length ? "Your top fixes" : "No important mistakes this time"}
            </h2>
            {report.corrections.length > 0 && (
              <p className="-mt-1.5 text-sm text-dim">
                Say each one out loud once. Producing it yourself is what makes it stick.
              </p>
            )}
            {report.corrections.map((c) => (
              <CorrectionCard
                key={c.original}
                correction={c}
                sessionId={session.id}
                fixed={session.fixedAloud.includes(c.error_key)}
                hebrewHelp={prefs.hebrewHelp}
                voiceId={prefs.tutorVoiceId}
                dailyGoalMinutes={prefs.dailyGoalMinutes}
              />
            ))}
          </section>

          {report.interview && (
            <InterviewCard interview={report.interview} voiceId={prefs.tutorVoiceId} hebrewHelp={prefs.hebrewHelp} />
          )}

          {report.level && report.level.confidence !== "low" && (
            <section className="tile flex items-center gap-4 p-4" aria-label="Speaking level in this conversation">
              <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-accent text-xl font-black text-white">
                {report.level.cefr}
              </span>
              <div>
                <p className="font-extrabold">Speaking level in this conversation</p>
                {report.level.note_en && <p className="text-sm text-dim">{report.level.note_en}</p>}
              </div>
            </section>
          )}

          {report.phrases.length > 0 && (
            <section aria-labelledby="phrases-title" className="space-y-2.5">
              <h2 id="phrases-title" className="flex items-center gap-2 font-black">
                <Sparkles className="size-5 text-xp" aria-hidden /> Saved to your phrase bank
              </h2>
              <ul className="space-y-2">
                {report.phrases.map((p) => (
                  <PhraseRow
                    key={p.text}
                    text={p.text}
                    meaning={p.meaning_en}
                    hebrew={p.meaning_he}
                    showHe={prefs.hebrewHelp}
                  />
                ))}
              </ul>
              <p className="text-xs font-bold text-faint">
                They&apos;ll come back in your warm-up when it&apos;s time to review them.
              </p>
            </section>
          )}
        </>
      )}

      <dl className="tile grid grid-cols-4 divide-x-2 divide-line py-3 text-center" aria-label="Session stats">
        <Stat
          icon={Clock}
          label={session.mode === "voice" ? "min speaking" : "min"}
          value={(voiceSeconds / 60).toFixed(1)}
        />
        <Stat icon={Gauge} label="wpm" value={wpm ?? "—"} />
        <Stat icon={MessageCircle} label="your turns" value={learnerTurns.length} />
        <Stat icon={LifeBuoy} label="“I'm stuck”" value={session.stuckCount} />
      </dl>

      <details className="tile p-4">
        <summary className="cursor-pointer font-extrabold">Full transcript</summary>
        <ol className="mt-3 space-y-2 text-sm">
          {session.turns.map((t, i) => (
            <li
              key={i}
              dir="auto"
              lang={t.input === "stuck" ? "he" : "en"}
              className={t.role === "tutor" ? "text-dim" : ""}
            >
              <span className="font-extrabold">{t.role === "tutor" ? "Them" : "You"}: </span>
              {t.text}
            </li>
          ))}
        </ol>
      </details>

      {week && (
        <section aria-labelledby="words-title" className="tile space-y-2 p-4">
          <h2 id="words-title" className="font-black">
            Words of the week
          </h2>
          {wordsUsed.length ? (
            <p className="text-sm text-dim">
              You used{" "}
              {wordsUsed.map((w, i) => (
                <span key={w.text}>
                  {i ? ", " : ""}
                  <span className="font-extrabold text-good">{w.text}</span>
                </span>
              ))}
              . Two good uses make a word yours.
            </p>
          ) : (
            <p className="text-sm text-dim">
              None this time. Next conversation, try one of:{" "}
              {week.words
                .slice(0, 3)
                .map((w) => w.text)
                .join(", ")}
              .
            </p>
          )}
        </section>
      )}

      {report && !session.demo && (
        <KeepGoing
          avoid={[scenario.id]}
          next={
            planNext || next.id !== scenario.id
              ? {
                  href: nextHref,
                  label: planNext ? `Up next · Week ${planNext.week}, day ${planNext.day}` : "Up next",
                  title: next.title,
                  summary: next.summary,
                }
              : null
          }
        />
      )}

      <div className="grid grid-cols-2 gap-3 pb-6">
        <Link href={`/session/${scenario.id}`} className="btn-3d btn-ghost flex items-center justify-center gap-2 py-3">
          <RotateCcw className="size-4" aria-hidden /> Again
        </Link>
        <Link href="/" className="btn-3d btn-go flex items-center justify-center py-3 uppercase">
          Continue
        </Link>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto min-h-dvh max-w-xl space-y-5 px-4 py-6">{children}</main>;
}

function Stat({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string | number }) {
  return (
    <div className="px-1">
      <dt className="flex items-center justify-center gap-1 text-xs font-bold text-dim">
        <Icon className="size-3.5 text-accent" aria-hidden /> {label}
      </dt>
      <dd className="text-lg font-black">{value}</dd>
    </div>
  );
}

function PhraseRow({
  text,
  meaning,
  hebrew,
  showHe,
}: {
  text: string;
  meaning: string;
  hebrew: string;
  showHe: boolean;
}) {
  const [open, setOpen] = useState(showHe);
  return (
    <li className="tile p-3">
      <p className="font-extrabold">{text}</p>
      {meaning && <p className="text-sm text-dim">{meaning}</p>}
      {hebrew &&
        (open ? (
          <p dir="rtl" lang="he" className="mt-1 text-sm">
            {hebrew}
          </p>
        ) : (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-1 inline-flex items-center gap-1 text-sm font-extrabold text-accent"
          >
            <Languages className="size-4" aria-hidden /> Translate
          </button>
        ))}
    </li>
  );
}
