import { Award, Lock } from "lucide-react";
import clsx from "clsx";
import { PLACEMENT, SEED_ERRORS } from "@/content/learner-seed";
import { ACHIEVEMENTS, EMPTY_STATS } from "@/lib/game/achievements";
import { levelFromXp } from "@/lib/game/xp";

export const dynamic = "force-dynamic";

const CATEGORY_LABEL: Record<(typeof SEED_ERRORS)[number]["category"], string> = {
  grammar: "Grammar",
  vocabulary: "Vocabulary",
  preposition: "Prepositions",
  word_order: "Word order",
  discourse: "Answering",
};

export default function ProgressPage() {
  // Stats come from Supabase once sessions are stored; until then this is the true zero state.
  const stats = EMPTY_STATS;
  const lvl = levelFromXp(stats.xp);

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
        <dl className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-elev-2 p-3">
            <dt className="text-sm font-bold text-dim">Understanding</dt>
            <dd className="text-2xl font-black">{PLACEMENT.comprehension}</dd>
          </div>
          <div className="rounded-xl bg-elev-2 p-3">
            <dt className="text-sm font-bold text-dim">Speaking</dt>
            <dd className="text-2xl font-black text-accent-2">{PLACEMENT.production}</dd>
          </div>
          <div className="rounded-xl bg-elev-2 p-3">
            <dt className="text-sm font-bold text-dim">Fluency</dt>
            <dd className="text-sm font-bold text-faint">After your placement chat</dd>
          </div>
          <div className="rounded-xl bg-elev-2 p-3">
            <dt className="text-sm font-bold text-dim">Pronunciation</dt>
            <dd className="text-sm font-bold text-faint">After your placement chat</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs font-bold text-faint">
          From the placement quiz on {PLACEMENT.date} ({PLACEMENT.quizScore} plus a writing sample).
        </p>
      </section>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Current streak", value: `${stats.currentStreak} days` },
          { label: "Best streak", value: `${stats.bestStreak} days` },
          { label: "Minutes spoken", value: Math.round(stats.totalSpeakingSeconds / 60) },
          { label: "Conversations", value: stats.sessions },
        ].map((s) => (
          <div key={s.label} className="tile p-3">
            <p className="text-xs font-bold text-dim">{s.label}</p>
            <p className="text-xl font-black">{s.value}</p>
          </div>
        ))}
      </div>

      <section aria-labelledby="mistakes-title" className="space-y-3">
        <div>
          <h2 id="mistakes-title" className="font-black">
            Mistakes you&apos;re working on
          </h2>
          <p className="text-sm text-dim">
            Each one moves from New to Practicing to Mastered as you use it correctly in conversations.
          </p>
        </div>
        <ul className="space-y-2.5">
          {SEED_ERRORS.map((e) => (
            <li key={e.key} className="tile p-3.5">
              <div className="flex items-start justify-between gap-2">
                <p className="font-extrabold">{e.title}</p>
                <span className="shrink-0 rounded-full bg-warn/15 px-2 py-0.5 text-[11px] font-extrabold uppercase text-warn">
                  New
                </span>
              </div>
              <p className="mt-1 text-sm text-bad line-through decoration-bad/60">{e.example}</p>
              <p className="text-sm font-bold text-good">{e.better}</p>
              <p className="mt-2 text-xs font-bold text-dim">
                {CATEGORY_LABEL[e.category]} · Mission: {e.mission}
              </p>
            </li>
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
