import Link from "next/link";
import { ArrowRight, Clock, Flame, MessageCircle, Sparkles, Target, Trophy, Wrench, Zap } from "lucide-react";
import { setupStatus } from "@/lib/env";
import { ChooseVoicePrompt, Greeting, TutorBadge } from "@/components/HomeClient";
import { SEED_ERRORS } from "@/content/learner-seed";
import { EMPTY_STATS } from "@/lib/game/achievements";
import { levelFromXp } from "@/lib/game/xp";

export const dynamic = "force-dynamic";

const SESSION_STEPS = [
  { icon: Sparkles, title: "Warm-up", detail: "2 min · say yesterday's phrases out loud" },
  { icon: MessageCircle, title: "Conversation", detail: "8 to 10 min · with your tutor" },
  { icon: Target, title: "Report", detail: "3 key fixes, pronunciation, new phrases" },
];

export default function HomePage() {
  const status = setupStatus();
  const ready = status.azure && status.llm;
  // Until sessions are stored, the learner starts from zero. These come from Supabase next.
  const stats = EMPTY_STATS;
  const minutesToday = 0;
  const goal = 12;
  const { level } = levelFromXp(stats.xp);
  const [boss, ...rest] = SEED_ERRORS;

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
            <span className="block text-sm text-dim">Connect the speech and AI services. About 20 minutes.</span>
          </span>
          <ArrowRight className="size-5 text-dim" aria-hidden />
        </Link>
      )}

      <section
        aria-labelledby="mission-title"
        className="rounded-3xl bg-accent p-5 text-white"
        style={{ boxShadow: "0 6px 0 var(--accent-deep)" }}
      >
        <p className="text-xs font-extrabold uppercase tracking-wider opacity-85">Today&apos;s mission</p>
        <h2 id="mission-title" className="mt-1 text-2xl font-black leading-tight">
          Tell your tutor about your AZ-900 prep
        </h2>
        <p className="mt-1.5 font-bold opacity-95">{boss.mission}</p>
        <div
          className="mt-4 h-3 overflow-hidden rounded-full bg-white/25"
          role="progressbar"
          aria-label="Minutes spoken today"
          aria-valuemin={0}
          aria-valuemax={goal}
          aria-valuenow={minutesToday}
        >
          <div className="h-full rounded-full bg-xp" style={{ width: `${(minutesToday / goal) * 100}%` }} />
        </div>
        <p className="mt-1.5 text-xs font-extrabold">
          {minutesToday} of {goal} minutes
        </p>
      </section>

      <div className="space-y-3">
        <Link
          href={ready ? "/practice" : "/setup"}
          className="btn-3d btn-go flex w-full items-center justify-center gap-2 py-4 text-lg uppercase"
        >
          Start talking <ArrowRight className="size-5" aria-hidden />
        </Link>
        <div className="flex justify-center">
          <TutorBadge />
        </div>
      </div>

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

      <section className="tile p-4" aria-labelledby="boss-title">
        <div className="flex items-center gap-2">
          <Zap className="size-5 fill-current text-xp" aria-hidden />
          <h2 id="boss-title" className="font-black">
            Boss mistake: {boss.title}
          </h2>
        </div>
        <p className="mt-3 font-bold text-bad line-through decoration-bad/60">{boss.example}</p>
        <p className="font-extrabold text-good">{boss.better}</p>
        <p className="mt-2 text-sm text-dim">{boss.why}</p>
      </section>

      <section className="tile p-4" aria-labelledby="focus-title">
        <div className="flex items-center justify-between">
          <h2 id="focus-title" className="font-black">
            Also on your list
          </h2>
          <Link href="/progress" className="text-sm font-extrabold text-accent">
            See all {SEED_ERRORS.length}
          </Link>
        </div>
        <ul className="mt-3 space-y-2.5">
          {rest.slice(0, 3).map((e) => (
            <li key={e.key} className="rounded-xl bg-elev-2 p-3">
              <p className="text-sm font-extrabold">{e.title}</p>
              <p className="mt-0.5 text-sm text-bad line-through decoration-bad/60">{e.example}</p>
              <p className="text-sm font-bold text-good">{e.better}</p>
            </li>
          ))}
        </ul>
      </section>

      <ChooseVoicePrompt />
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
