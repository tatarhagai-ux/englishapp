"use client";

import Link from "next/link";
import { ArrowRight, Award, Briefcase, ChevronRight, Lock } from "lucide-react";
import clsx from "clsx";
import { PLACEMENT } from "@/content/learner-seed";
import { scenarioById } from "@/content/scenarios";
import { ACHIEVEMENTS } from "@/lib/game/achievements";
import { levelFromXp } from "@/lib/game/xp";
import { dayKey, friendlyDay } from "@/lib/game/streak";
import { useLearner } from "@/lib/client/learner";
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

      <section aria-labelledby="badges-title" className="space-y-3">
        <h2 id="badges-title" className="font-black">
          Achievements
        </h2>
        <ul className="grid grid-cols-2 gap-3">
          {ACHIEVEMENTS.map((a) => {
            const p = a.progress(stats);
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
      </section>
    </div>
  );
}

function MistakeRow({ e }: { e: ErrorRecord }) {
  return (
    <li className="tile p-3.5">
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
