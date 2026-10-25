import Link from "next/link";
import { ArrowRight, Flame, Headphones, MessageCircle, Sparkles, Target, Wrench } from "lucide-react";
import { setupStatus } from "@/lib/env";
import { ProgressRing } from "@/components/ProgressRing";
import { Greeting, TutorBadge } from "@/components/HomeClient";
import { PLACEMENT, SEED_ERRORS } from "@/content/learner-seed";

export const dynamic = "force-dynamic";

const SESSION_STEPS = [
  { icon: Sparkles, title: "Warm-up", detail: "2 min · say yesterday's phrases out loud" },
  { icon: MessageCircle, title: "Conversation", detail: "8 to 10 min · with your tutor" },
  { icon: Target, title: "Report", detail: "3 key fixes, pronunciation, new phrases" },
];

export default function HomePage() {
  const status = setupStatus();
  const ready = status.azure && status.openrouter;
  const minutesToday = 0;
  const goal = 12;
  const streak = 0;

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between gap-4">
        <div>
          <Greeting />
          <p className="mt-1 text-sm text-dim">Ten minutes of speaking beats an hour of reading about it.</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-line bg-elev px-3 py-1.5 text-sm font-semibold">
          <Flame className="size-4 text-warn" aria-hidden />
          <span aria-label={`${streak} day streak`}>{streak}</span>
        </div>
      </header>

      {!ready && (
        <Link
          href="/setup"
          className="card flex items-center gap-3 border-warn/40 p-4 transition-colors hover:border-warn"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-warn/15 text-warn">
            <Wrench className="size-5" aria-hidden />
          </span>
          <span className="flex-1">
            <span className="block font-semibold">Finish setup to start talking</span>
            <span className="block text-sm text-dim">Connect the speech and AI services. About 15 minutes.</span>
          </span>
          <ArrowRight className="size-5 text-dim" aria-hidden />
        </Link>
      )}

      <section className="card overflow-hidden" aria-labelledby="today-title">
        <div className="accent-gradient px-5 pb-5 pt-4 text-white">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Today&apos;s session</p>
          <h2 id="today-title" className="mt-1 text-xl font-semibold">
            Tell me about your week
          </h2>
          <p className="mt-1 text-sm opacity-90">Focus: present perfect for “how long”, and studying for an exam.</p>
        </div>
        <ol className="divide-y divide-line">
          {SESSION_STEPS.map(({ icon: Icon, title, detail }) => (
            <li key={title} className="flex items-center gap-3 px-5 py-3">
              <Icon className="size-5 text-accent" aria-hidden />
              <div>
                <p className="text-sm font-medium">{title}</p>
                <p className="text-xs text-dim">{detail}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-4">
          <TutorBadge />
          <Link
            href={ready ? "/practice" : "/setup"}
            className="accent-gradient inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent/20"
          >
            Start <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4">
        <section className="card flex flex-col items-center gap-2 p-4" aria-label="Daily goal">
          <ProgressRing value={minutesToday} max={goal} label={`${minutesToday} of ${goal} minutes today`}>
            <div>
              <p className="text-xl font-semibold">{minutesToday}</p>
              <p className="text-[11px] text-dim">of {goal} min</p>
            </div>
          </ProgressRing>
          <p className="text-sm font-medium">Daily goal</p>
        </section>
        <section className="card flex flex-col justify-between p-4" aria-label="Your level">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-faint">Starting level</p>
            <p className="mt-2 text-sm text-dim">Understanding</p>
            <p className="text-2xl font-semibold">{PLACEMENT.comprehension}</p>
            <p className="mt-1 text-sm text-dim">Speaking</p>
            <p className="text-2xl font-semibold text-gradient">{PLACEMENT.production}</p>
          </div>
          <p className="mt-2 text-[11px] text-faint">From your quiz. The placement chat will refine it.</p>
        </section>
      </div>

      <section className="card p-5" aria-labelledby="focus-title">
        <div className="flex items-center justify-between">
          <h2 id="focus-title" className="font-semibold">
            Your focus areas
          </h2>
          <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-semibold text-accent">
            {SEED_ERRORS.length} to work on
          </span>
        </div>
        <ul className="mt-3 space-y-3">
          {SEED_ERRORS.slice(0, 4).map((e) => (
            <li key={e.key} className="rounded-xl bg-elev-2 p-3">
              <p className="text-sm font-medium">{e.title}</p>
              <p className="mt-1 text-sm text-bad/90 line-through decoration-bad/50">{e.example}</p>
              <p className="text-sm text-good">{e.better}</p>
            </li>
          ))}
        </ul>
      </section>

      <Link
        href="/settings/voice"
        className="card flex items-center gap-3 p-4 transition-colors hover:border-accent/60"
      >
        <span className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent">
          <Headphones className="size-5" aria-hidden />
        </span>
        <span className="flex-1">
          <span className="block font-semibold">Choose your tutor&apos;s voice</span>
          <span className="block text-sm text-dim">Listen to 8 voices and pick the one you like.</span>
        </span>
        <ArrowRight className="size-5 text-dim" aria-hidden />
      </Link>
    </div>
  );
}
