"use client";

import Link from "next/link";
import { ArrowRight, AudioLines, Check, Clock, Headphones, RotateCcw } from "lucide-react";
import { CATEGORY_INFO, SCENARIOS, characterName, type Scenario, type ScenarioCategory } from "@/content/scenarios";
import { voiceById } from "@/content/voices";
import { useHydrated, useLearner } from "@/lib/client/learner";
import { usePrefs } from "@/lib/client/prefs";
import { recommendScenario, warmupItems } from "@/lib/learner/model";
import { QUICK_REVIEW_MAX } from "./QuickReview";
import { Avatar } from "./Avatar";

const ORDER: ScenarioCategory[] = ["interview", "free", "work", "abroad", "world"];

export function PracticeLibrary() {
  const state = useLearner();
  const hydrated = useHydrated();
  const [prefs] = usePrefs();
  const recommended = recommendScenario(state);
  const done = new Set(state.sessions.filter((s) => !s.demo && s.report?.task.completed).map((s) => s.scenarioId));
  const tutorName = voiceById(prefs.tutorVoiceId)?.displayName ?? "Your tutor";
  const due = hydrated ? warmupItems(state, new Date(), QUICK_REVIEW_MAX).length : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black tracking-tight">Practice</h1>

      {hydrated && (
        <section aria-labelledby="rec-title">
          <p className="mb-2 text-xs font-extrabold uppercase tracking-wider text-faint">Recommended for you</p>
          <Link
            href={`/session/${recommended.id}`}
            className="block rounded-3xl bg-accent p-5 text-white"
            style={{ boxShadow: "0 6px 0 var(--accent-deep)" }}
          >
            <p className="text-xs font-extrabold uppercase tracking-wider opacity-85">
              {CATEGORY_INFO[recommended.category].label} · {recommended.minutes} min
            </p>
            <h2 id="rec-title" className="mt-1 text-xl font-black">
              {recommended.title}
            </h2>
            <p className="mt-1 text-sm font-bold opacity-95">{recommended.summary}</p>
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-white/20 px-3 py-1.5 text-sm font-extrabold">
              Start <ArrowRight className="size-4" aria-hidden />
            </span>
          </Link>
        </section>
      )}

      <Link href="/listen" className="tile flex items-center gap-3 p-4 transition-colors hover:border-accent/60">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-accent-soft text-accent">
          <Headphones className="size-6" aria-hidden />
        </span>
        <span className="flex-1">
          <span className="block font-extrabold">Listening gym</span>
          <span className="block text-sm text-dim">Dictation and shadowing in 4 accents. Speed adapts to you.</span>
        </span>
        <ArrowRight className="size-5 text-faint" aria-hidden />
      </Link>

      <Link href="/pronounce" className="tile flex items-center gap-3 p-4 transition-colors hover:border-accent/60">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-accent-soft text-accent">
          <AudioLines className="size-6" aria-hidden />
        </span>
        <span className="flex-1">
          <span className="block font-extrabold">Pronunciation for Hebrew speakers</span>
          <span className="block text-sm text-dim">
            TH, W/V, ship/sheep, stress and a friendlier melody. 10 short units.
          </span>
        </span>
        <ArrowRight className="size-5 text-faint" aria-hidden />
      </Link>

      <Link href="/review" className="tile flex items-center gap-3 p-4 transition-colors hover:border-accent/60">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-accent-soft text-accent">
          <RotateCcw className="size-6" aria-hidden />
        </span>
        <span className="flex-1">
          <span className="block font-extrabold">Quick review</span>
          <span className="block text-sm text-dim">
            {due > 0 ? `${due} due · ` : ""}Two minutes on your mistakes and phrases, no conversation.
          </span>
        </span>
        <ArrowRight className="size-5 text-faint" aria-hidden />
      </Link>

      {ORDER.map((cat) => (
        <section key={cat} aria-labelledby={`cat-${cat}`} className="space-y-2.5">
          <div>
            <h2 id={`cat-${cat}`} className="font-black">
              {CATEGORY_INFO[cat].label}
            </h2>
            <p className="text-xs font-bold text-faint">Goal: {CATEGORY_INFO[cat].goal}</p>
          </div>
          <ul className="space-y-2.5">
            {SCENARIOS.filter((s) => s.category === cat && !s.hidden).map((s) => (
              <li key={s.id}>
                <ScenarioCard scenario={s} done={done.has(s.id)} tutorName={tutorName} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function ScenarioCard({ scenario, done, tutorName }: { scenario: Scenario; done: boolean; tutorName: string }) {
  const voice = scenario.voiceId ? voiceById(scenario.voiceId) : null;
  const name = characterName(scenario) ?? voice?.displayName;
  const who = voice ? `${name} · ${voice.accent}` : `With ${tutorName}`;
  return (
    <Link
      href={`/session/${scenario.id}`}
      className="tile flex items-center gap-3 p-3.5 transition-colors hover:border-accent/60"
    >
      <Avatar name={name ?? tutorName} size={44} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 font-extrabold">
          {scenario.title}
          {done && (
            <span className="grid size-5 place-items-center rounded-full bg-go text-go-ink" aria-label="Completed">
              <Check className="size-3.5" strokeWidth={3} aria-hidden />
            </span>
          )}
        </span>
        <span className="block text-sm text-dim">{scenario.summary}</span>
        <span className="mt-1 flex items-center gap-1 text-xs font-bold text-faint">
          {who} · <Clock className="size-3" aria-hidden /> {scenario.minutes} min
        </span>
      </span>
      <ArrowRight className="size-5 shrink-0 text-faint" aria-hidden />
    </Link>
  );
}
