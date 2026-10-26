"use client";

import { PLAN } from "@/content/plan";
import { ownedStretchWords } from "@/lib/learner/plan";
import { speakingChecks, weeklySummary } from "@/lib/learner/weekly";
import { adaptation } from "@/lib/learner/adapt";
import { LEVEL_TEXT } from "./CoachCard";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Award, Briefcase, ChevronRight, Lock } from "lucide-react";
import clsx from "clsx";
import { PLACEMENT } from "@/content/learner-seed";
import { scenarioById } from "@/content/scenarios";
import { ACHIEVEMENTS } from "@/lib/game/achievements";
import { levelFromXp } from "@/lib/game/xp";
import { dayKey, friendlyDay } from "@/lib/game/streak";
import { useHydrated, useLearner } from "@/lib/client/learner";
import {
  averageWpm,
  currentSpeakingLevel,
  interviewReadiness,
  isRealSession,
  levelHistory,
  statsFrom,
  type Cefr,
  type ErrorRecord,
  type ErrorStatus,
} from "@/lib/learner/model";
import { wordCount } from "@/lib/text/compare";
import { monthKey } from "@/lib/cost/budget";

const STATUS_STYLE: Record<ErrorStatus, string> = {
  new: "bg-warn/15 text-warn",
  practicing: "bg-accent-soft text-accent",
  mastered: "bg-go/15 text-good",
};
const STATUS_ORDER: Record<ErrorStatus, number> = { new: 0, practicing: 1, mastered: 2 };

export function ProgressView({ budgetUsd }: { budgetUsd: number }) {
  const state = useLearner();
  const today = dayKey(new Date());
  const stats = statsFrom(state, today);
  const lvl = levelFromXp(stats.xp);
  const errors = Object.values(state.errors).sort(
    (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || b.occurrences - a.occurrences,
  );
  const recent = state.sessions.filter(isRealSession).slice(-10).reverse();
  const spent = state.spend[monthKey()] ?? 0;
  const history = levelHistory(state);
  const speaking = currentSpeakingLevel(state, PLACEMENT.production as Cefr);
  const wpm = averageWpm(state, wordCount);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-black tracking-tight">Progress</h1>

      <WeekSection />

      <section className="tile p-4" aria-labelledby="level-title">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-faint">Your level</p>
            <h2 id="level-title" className="text-3xl font-black">
              Level {lvl.level}
            </h2>
          </div>
          <p className="font-extrabold text-xp">{stats.xp} XP</p>
        </div>
        <div
          className="mt-3 h-3 overflow-hidden rounded-full bg-elev-2"
          role="progressbar"
          aria-label="XP toward next level"
          aria-valuemin={0}
          aria-valuemax={lvl.needed}
          aria-valuenow={lvl.intoLevel}
        >
          <div className="h-full rounded-full bg-xp" style={{ width: `${(lvl.intoLevel / lvl.needed) * 100}%` }} />
        </div>
        <p className="mt-1.5 text-xs font-bold text-dim">
          {lvl.needed - lvl.intoLevel} XP to level {lvl.level + 1}. You earn XP for minutes spoken, missions and
          mistakes you fix out loud.
        </p>
      </section>

      <section className="tile p-4" aria-labelledby="skills-title">
        <h2 id="skills-title" className="font-black">
          English level
        </h2>
        <dl className="mt-3 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-elev-2 p-3">
            <dt className="text-xs font-bold text-dim">Understanding</dt>
            <dd className="text-2xl font-black">{PLACEMENT.comprehension}</dd>
          </div>
          <div className="rounded-xl bg-elev-2 p-3">
            <dt className="text-xs font-bold text-dim">Speaking</dt>
            <dd className="text-2xl font-black text-accent-2">{speaking}</dd>
          </div>
          <div className="rounded-xl bg-elev-2 p-3">
            <dt className="text-xs font-bold text-dim">Words / min</dt>
            <dd className="text-2xl font-black">{wpm ?? "—"}</dd>
          </div>
        </dl>
        {history.length > 0 ? (
          <ol className="mt-3 flex flex-wrap gap-1.5" aria-label="Speaking level over time">
            {history.slice(-12).map((p, i) => (
              <li key={i} className="rounded-lg bg-elev-2 px-2 py-1 text-xs font-bold text-dim">
                {p.day.slice(5)} <span className="font-black text-text">{p.cefr}</span>
                {p.placement ? " ★" : ""}
              </li>
            ))}
          </ol>
        ) : null}
        <p className="mt-3 text-xs font-bold text-faint">
          {history.length
            ? "Speaking is the middle of your last five conversation estimates. ★ = level check. Native speakers talk at about 120 to 150 words a minute."
            : `From the placement quiz on ${PLACEMENT.date} (${PLACEMENT.quizScore} plus a writing sample). Each conversation updates it.`}
        </p>
      </section>

      <InterviewReadinessCard state={state} />

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Current streak", value: `${stats.currentStreak} days` },
          { label: "Best streak", value: `${stats.bestStreak} days` },
          { label: "Minutes spoken", value: Math.round(stats.totalSpeakingSeconds / 60) },
          { label: "Conversations", value: stats.sessions },
          { label: "Phrases saved", value: state.phrases.length },
          { label: "AI spend this month", value: `$${spent.toFixed(2)} / $${budgetUsd}` },
        ].map((s) =>
          s.label === "Phrases saved" ? (
            <Link key={s.label} href="/phrases" className="tile p-3 transition-colors hover:border-accent/60">
              <p className="text-xs font-bold text-dim">{s.label}</p>
              <p className="flex items-center justify-between text-xl font-black">
                {s.value} <ChevronRight className="size-5 text-faint" aria-hidden />
              </p>
            </Link>
          ) : (
            <div key={s.label} className="tile p-3">
              <p className="text-xs font-bold text-dim">{s.label}</p>
              <p className="text-xl font-black">{s.value}</p>
            </div>
          ),
        )}
      </div>

      {recent.length > 0 && (
        <section aria-labelledby="history-title" className="space-y-2.5">
          <h2 id="history-title" className="font-black">
            Recent conversations
          </h2>
          <ul className="tile divide-y-2 divide-line overflow-hidden">
            {recent.map((s) => (
              <li key={s.id}>
                <Link href={`/report/${s.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-elev-2">
                  <span className="flex-1">
                    <span className="block font-extrabold">{scenarioById(s.scenarioId)?.title ?? "Conversation"}</span>
                    <span className="block text-xs font-bold text-dim">
                      {friendlyDay(s.day, today)} · {Math.max(1, Math.round(s.speakingSeconds / 60))} min ·{" "}
                      {s.report ? (s.report.task.completed ? "mission complete" : "mission open") : "no report yet"}
                    </span>
                  </span>
                  {s.xp > 0 && <span className="text-sm font-black text-xp">+{s.xp}</span>}
                  <ChevronRight className="size-5 text-faint" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="mistakes-title" className="space-y-3">
        <div>
          <h2 id="mistakes-title" className="font-black">
            Mistakes you&apos;re working on
          </h2>
          <p className="text-sm text-dim">
            New → Practicing once you use it correctly → Mastered after two clean conversations in a row.
          </p>
        </div>
        <ul className="space-y-2.5">
          {errors.map((e) => (
            <MistakeRow key={e.key} e={e} />
          ))}
        </ul>
      </section>

      <Achievements stats={stats} />
    </div>
  );
}

/** Earned ones plus the two closest, so the list motivates instead of scrolling forever. */
function Achievements({ stats }: { stats: ReturnType<typeof statsFrom> }) {
  const [all, setAll] = useState(false);
  const scored = ACHIEVEMENTS.map((a) => ({ a, p: a.progress(stats) }));
  const earned = scored.filter((x) => x.p >= 1);
  const next = scored
    .filter((x) => x.p < 1)
    .sort((x, y) => y.p - x.p)
    .slice(0, 2);
  const shown = all ? scored : [...earned, ...next];
  return (
    <section aria-labelledby="badges-title" className="space-y-3">
      <h2 id="badges-title" className="flex items-baseline justify-between font-black">
        Achievements
        <span className="text-sm font-bold text-dim">
          {earned.length} of {ACHIEVEMENTS.length}
        </span>
      </h2>
      <ul className="grid grid-cols-2 gap-3">
        {shown.map(({ a, p }) => {
          const done = p >= 1;
          return (
            <li key={a.key} className={clsx("tile flex flex-col gap-2 p-3", !done && "opacity-80")}>
              <span
                className={clsx(
                  "grid size-10 place-items-center rounded-2xl",
                  done ? "bg-xp text-[#3a2a00]" : "bg-elev-2 text-faint",
                )}
              >
                {done ? <Award className="size-5" aria-hidden /> : <Lock className="size-4" aria-hidden />}
              </span>
              <div>
                <p className="text-sm font-extrabold">{a.title}</p>
                <p className="text-xs text-dim">{a.detail}</p>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-elev-2" aria-hidden>
                <div className="h-full rounded-full bg-go" style={{ width: `${p * 100}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
      {!all && shown.length < ACHIEVEMENTS.length && (
        <button type="button" onClick={() => setAll(true)} className="text-sm font-extrabold text-accent">
          Show all {ACHIEVEMENTS.length}
        </button>
      )}
    </section>
  );
}

function MistakeRow({ e }: { e: ErrorRecord }) {
  return (
    <li>
      <Link
        href={`/mistakes/${encodeURIComponent(e.key)}`}
        className="tile block p-3.5 transition-colors hover:border-accent/60"
      >
        <div className="flex items-start justify-between gap-2">
          <p className="font-extrabold">{e.title}</p>
          <span
            className={clsx(
              "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-extrabold uppercase",
              STATUS_STYLE[e.status],
            )}
          >
            {e.status}
          </span>
        </div>
        <p className="mt-1 text-sm text-bad line-through decoration-bad/60">{e.example}</p>
        <p className="text-sm font-bold text-good">{e.better}</p>
        <p className="mt-2 text-xs font-bold text-dim">
          Seen {e.occurrences}× · used correctly {e.correctUses}×{e.mission ? ` · Mission: ${e.mission}` : ""}
        </p>
        <p className="mt-1.5 text-xs font-extrabold text-accent">Rule, examples and a drill →</p>
      </Link>
    </li>
  );
}

/** Goal #1 is a job interview in English, so its readiness gets its own card. */
function InterviewReadinessCard({ state }: { state: Parameters<typeof interviewReadiness>[0] }) {
  const r = interviewReadiness(state);
  return (
    <section className="tile space-y-3 p-4" aria-labelledby="interview-ready-title">
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
          <Briefcase className="size-5" aria-hidden />
        </span>
        <h2 id="interview-ready-title" className="flex-1 font-black">
          Interview readiness
        </h2>
        {r.readiness !== null && (
          <span className="text-2xl font-black text-accent" aria-label={`${r.readiness} of 5`}>
            {r.readiness}/5
          </span>
        )}
      </div>
      <div
        className="h-2.5 overflow-hidden rounded-full bg-elev-2"
        role="progressbar"
        aria-label="Interview questions practiced"
        aria-valuemin={0}
        aria-valuemax={r.total}
        aria-valuenow={r.practiced}
      >
        <div className="h-full rounded-full bg-accent" style={{ width: `${(r.practiced / r.total) * 100}%` }} />
      </div>
      <p className="text-sm text-dim">
        {r.practiced} of {r.total} interview scenarios practiced.{" "}
        {r.weakest
          ? `Most often missing: ${r.weakest.missing}, in ${Math.round((1 - r.weakest.rate) * 100)}% of your recent answers.`
          : r.answers >= 2
            ? "Your answers have all four parts most of the time. Keep it up."
            : "Each interview report checks four things: a direct answer, a real example, what you did, and the result."}
      </p>
      {r.practiced < r.total && (
        <Link href="/practice" className="inline-flex items-center gap-1 text-sm font-extrabold text-accent">
          Practice an interview question <ArrowRight className="size-4" aria-hidden />
        </Link>
      )}
    </section>
  );
}

/** This week against last week, the plan's speaking checks, and the words he owns. */
function WeekSection() {
  const state = useLearner();
  const hydrated = useHydrated();
  if (!hydrated) return null;
  const today = dayKey(new Date());
  const { thisWeek, lastWeek } = weeklySummary(state, today);
  const checks = speakingChecks(state);
  const adapt = adaptation(state, today);
  const owned = ownedStretchWords(state);
  const totalWords = PLAN.reduce((n, w) => n + w.words.length, 0);
  const rows: { label: string; now: number; before: number; goal?: number }[] = [
    { label: "Days practiced", now: thisWeek.daysPracticed, before: lastWeek.daysPracticed, goal: 5 },
    { label: "Minutes spoken", now: thisWeek.minutesSpoken, before: lastWeek.minutesSpoken },
    { label: "Plan days done", now: thisWeek.planDays, before: lastWeek.planDays, goal: 5 },
    { label: "Fixes said out loud", now: thisWeek.fixesSaidAloud, before: lastWeek.fixesSaidAloud },
  ];
  return (
    <>
      <section className="tile space-y-3 p-4" aria-labelledby="week-title">
        <h2 id="week-title" className="font-black">
          This week
        </h2>
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.label} className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-dim">{r.label}</span>
              <span className="font-extrabold">
                {r.now}
                {r.goal ? ` / ${r.goal}` : ""}
                <span
                  className={clsx(
                    "ml-2 text-xs",
                    r.now > r.before ? "text-good" : r.now < r.before ? "text-warn" : "text-faint",
                  )}
                >
                  {r.now === r.before
                    ? "same as last week"
                    : `${r.now > r.before ? "+" : ""}${r.now - r.before} vs last week`}
                </span>
              </span>
            </li>
          ))}
        </ul>
        <p className="text-xs font-bold text-faint">
          Weeks run Sunday to Saturday. Two rest days in a row keep your streak.
        </p>
      </section>

      <section className="tile space-y-2 p-4" aria-labelledby="adapt-title">
        <h2 id="adapt-title" className="font-black">
          How your tutor adapts
        </h2>
        <p className="text-sm">
          <span className="font-extrabold">{LEVEL_TEXT[adapt.level]}</span>
          <span className="text-dim">, because {adapt.reasons.join(" and ")}.</span>
        </p>
        <p className="text-xs font-bold text-faint">
          It looks at your last 3 conversations: how often you got stuck, asked to hear it again, and how long your
          answers were, plus how the week felt to you. It is always patient, and gives one word when you search for one.
        </p>
      </section>

      <section className="tile space-y-3 p-4" aria-labelledby="checks-title">
        <h2 id="checks-title" className="font-black">
          Speaking checks
        </h2>
        <p className="text-sm text-dim">
          The same 4-minute chat at the start and at the end of weeks 4, 8 and 12, so you can compare like with like.
        </p>
        {checks.length ? (
          <ol className="space-y-2">
            {checks.map((c, i) => (
              <li key={c.sessionId}>
                <Link
                  href={`/report/${c.sessionId}`}
                  className="flex items-center justify-between gap-3 rounded-xl bg-elev-2 p-3 text-sm hover:bg-line"
                >
                  <span className="font-extrabold">
                    {c.week ? `End of week ${c.week}` : i === 0 ? "Start" : "Extra check"}
                  </span>
                  <span className="text-dim">
                    {c.cefr ?? "…"}
                    {c.wpm ? ` · ${c.wpm} words/min` : ""} · {c.stuck} stuck
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm font-bold text-faint">No check yet. The first one is on Home when you start.</p>
        )}
      </section>

      <section className="tile space-y-2 p-4" aria-labelledby="vocab-title">
        <div className="flex items-baseline justify-between">
          <h2 id="vocab-title" className="font-black">
            Words you own
          </h2>
          <span className="font-extrabold text-good">
            {owned} / {totalWords}
          </span>
        </div>
        <div
          className="h-2.5 overflow-hidden rounded-full bg-elev-2"
          role="progressbar"
          aria-label="Stretch words you own"
          aria-valuemin={0}
          aria-valuemax={totalWords}
          aria-valuenow={owned}
        >
          <div className="h-full rounded-full bg-good" style={{ width: `${(owned / totalWords) * 100}%` }} />
        </div>
        <p className="text-sm text-dim">
          Stretch words from the plan that you used twice in conversation. They&apos;re in your{" "}
          <Link href="/phrases" className="font-extrabold text-accent">
            phrase bank
          </Link>
          .
        </p>
      </section>
    </>
  );
}
