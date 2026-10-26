"use client";

import Link from "next/link";
import { ArrowRight, Clock, Flame, Gauge, MessageCircle, Sparkles, Target, Trophy, Wrench, Zap } from "lucide-react";
import { useHydrated, useLearner } from "@/lib/client/learner";
import { usePrefs } from "@/lib/client/prefs";
import { hasPlacement, levelHistory, minutesOnDay, rankedErrors, statsFrom, warmupItems } from "@/lib/learner/model";
import { PLACEMENT_ID } from "@/content/scenarios";
import { dayKey } from "@/lib/game/streak";
import { levelFromXp } from "@/lib/game/xp";
import { ChooseVoicePrompt, Greeting, TutorBadge, VoiceTipCard } from "./HomeClient";
import { UnfinishedCard } from "./UnfinishedCard";
import { QUICK_REVIEW_MAX } from "./QuickReview";
import { PlanToday } from "./PlanToday";
import { CoachCard } from "./CoachCard";
import { KeepGoing } from "./KeepGoing";

const SESSION_STEPS = [
  { icon: Sparkles, title: "Warm-up", detail: "Say phrases from past sessions out loud" },
  { icon: MessageCircle, title: "Conversation", detail: "8 to 10 min · with your tutor or a character" },
  { icon: Target, title: "Report", detail: "3 key fixes, say them again, new phrases" },
];

export function HomeDashboard({ ready }: { ready: boolean }) {
  const hydrated = useHydrated();
  const state = useLearner();
  const [prefs] = usePrefs();
  const today = dayKey(new Date());
  const stats = statsFrom(state, today);
  const minutesToday = minutesOnDay(state, today);
  const goal = prefs.dailyGoalMinutes;
  const { level } = levelFromXp(stats.xp);
  const ranked = rankedErrors(state);
  const boss = ranked[0];
  const goalMet = minutesToday >= goal;
  const lastReport = [...state.sessions].reverse().find((s) => s.report && !s.demo);
  // A brand-new learner gets one clear first step, the level check, instead of two competing ones.
  const firstTime = hydrated && ready && stats.sessions === 0 && !hasPlacement(state);
  const dueReviews = hydrated ? warmupItems(state, new Date(), QUICK_REVIEW_MAX).length : 0;
  const suggestCheck = hydrated && ready && !firstTime && !hasPlacement(state) && levelHistory(state).length < 3;

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-xp text-xl font-black text-[#3a2a00]">
            H
          </span>
          <div>
            <Greeting />
            <p className="text-sm font-bold text-dim">
              Level {level} · {stats.xp} XP
            </p>
          </div>
        </div>
        <span
          className="flex items-center gap-1 rounded-xl bg-streak/15 px-2.5 py-1.5 font-black text-streak"
          aria-label={`${stats.currentStreak} day streak`}
        >
          <Flame className="size-4 fill-current" aria-hidden />
          {stats.currentStreak}
        </span>
      </header>

      {!ready && (
        <Link
          href="/setup"
          className="tile flex items-center gap-3 border-warn/50 p-4 transition-colors hover:border-warn"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-warn/15 text-warn">
            <Wrench className="size-5" aria-hidden />
          </span>
          <span className="flex-1">
            <span className="block font-extrabold">Finish setup to start talking</span>
            <span className="block text-sm text-dim">Connect the AI tutor (OpenRouter). About 10 minutes.</span>
          </span>
          <ArrowRight className="size-5 text-dim" aria-hidden />
        </Link>
      )}

      {!ready && (
        <Link
          href="/session/free-your-week?demo=1"
          className="btn-3d btn-accent flex w-full items-center justify-center gap-2 py-3.5"
        >
          Try a demo conversation <ArrowRight className="size-5" aria-hidden />
        </Link>
      )}

      {/* After three level estimates from normal conversations, the level is known; skip the nudge. */}
      {suggestCheck && (
        <Link
          href={`/session/${PLACEMENT_ID}`}
          className="tile flex items-center gap-3 border-accent/60 bg-accent-soft p-4 transition-colors hover:border-accent"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-white">
            <Gauge className="size-5" aria-hidden />
          </span>
          <span className="flex-1">
            <span className="block font-extrabold">Measure your speaking level</span>
            <span className="block text-sm text-dim">A 4-minute chat that makes your plan sharper.</span>
          </span>
          <ArrowRight className="size-5 text-dim" aria-hidden />
        </Link>
      )}

      {hydrated && <UnfinishedCard />}

      {firstTime ? (
        <>
          <section
            aria-labelledby="mission-title"
            className="rounded-3xl bg-accent p-5 text-white"
            style={{ boxShadow: "0 6px 0 var(--accent-deep)" }}
          >
            <p className="text-xs font-extrabold uppercase tracking-wider opacity-85">Start here</p>
            <h2 id="mission-title" className="mt-1 text-2xl font-black leading-tight">
              Find your speaking level
            </h2>
            <p className="mt-1.5 font-bold opacity-95">
              A relaxed 4-minute chat, 5 questions. No corrections during it. Your 12-week plan starts right after.
            </p>
          </section>
          <Link
            href={`/session/${PLACEMENT_ID}`}
            className="btn-3d btn-go flex w-full items-center justify-center gap-2 py-4 text-lg uppercase"
          >
            Start <ArrowRight className="size-5" aria-hidden />
          </Link>
        </>
      ) : (
        <>
          <PlanToday ready={ready} minutesToday={minutesToday} goal={goal} />
          {/* Today's minutes are in: more to do, without hunting through Practice. */}
          {hydrated && ready && goalMet && <KeepGoing next={null} avoid={lastReport ? [lastReport.scenarioId] : []} />}
          <CoachCard />
        </>
      )}

      <div className="space-y-2">
        <div className="flex justify-center">
          <TutorBadge />
        </div>
        {dueReviews > 0 && !goalMet && (
          <Link href="/review" className="block text-center text-sm font-extrabold text-accent">
            Short on time? 2-minute review ({dueReviews} due)
          </Link>
        )}
      </div>

      {!firstTime && (
        <div className="grid grid-cols-3 gap-3">
          <StatTile icon={Flame} value={stats.currentStreak} label="day streak" tone="text-streak" />
          <StatTile icon={Trophy} value={stats.mistakesMastered} label="mistakes fixed" tone="text-go" />
          <StatTile
            icon={Clock}
            value={Math.round(stats.totalSpeakingSeconds / 60)}
            label="min spoken"
            tone="text-accent"
          />
        </div>
      )}

      {hydrated && lastReport?.report && (
        <Link href={`/report/${lastReport.id}`} className="tile flex items-center gap-3 p-4 hover:border-accent/60">
          <Target className="size-5 text-accent" aria-hidden />
          <span className="flex-1">
            <span className="block font-extrabold">Last report</span>
            <span className="block text-sm text-dim">
              {lastReport.report.corrections.length} fixes ·{" "}
              {lastReport.report.task.completed ? "mission complete" : "mission open"}
            </span>
          </span>
          <ArrowRight className="size-5 text-faint" aria-hidden />
        </Link>
      )}

      {stats.sessions === 0 && (
        <section className="tile p-4" aria-labelledby="steps-title">
          <h2 id="steps-title" className="text-sm font-extrabold uppercase tracking-wider text-faint">
            How a session works
          </h2>
          <ol className="mt-3 space-y-3">
            {SESSION_STEPS.map(({ icon: Icon, title, detail }, i) => (
              <li key={title} className="flex items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
                  <Icon className="size-5" aria-hidden />
                </span>
                <div>
                  <p className="font-extrabold">
                    {i + 1}. {title}
                  </p>
                  <p className="text-sm text-dim">{detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* The first screen stays on its one step; the seeded mistakes come from his written test. */}
      {boss && !firstTime && (
        <section className="tile p-4" aria-labelledby="boss-title">
          <div className="flex items-center gap-2">
            <Zap className="size-5 fill-current text-xp" aria-hidden />
            <h2 id="boss-title" className="font-black">
              Boss mistake: {boss.title}
            </h2>
          </div>
          {stats.sessions === 0 && <p className="mt-1 text-xs font-bold text-faint">From your English test</p>}
          <p className="mt-3 font-bold text-bad line-through decoration-bad/60">{boss.example}</p>
          <p className="font-extrabold text-good">{boss.better}</p>
          <p className="mt-2 text-sm text-dim">{boss.why}</p>
        </section>
      )}

      <ChooseVoicePrompt />
      {!firstTime && <VoiceTipCard />}
    </div>
  );
}

function StatTile({
  icon: Icon,
  value,
  label,
  tone,
}: {
  icon: typeof Flame;
  value: number;
  label: string;
  tone: string;
}) {
  return (
    <div className="tile flex flex-col items-center px-2 py-3 text-center">
      <Icon className={`size-5 ${tone}`} aria-hidden />
      <p className={`mt-1 text-2xl font-black ${tone}`}>{value}</p>
      <p className="text-xs font-bold text-dim">{label}</p>
    </div>
  );
}
