"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  AudioLines,
  BookMarked,
  Briefcase,
  Check,
  Clock,
  Headphones,
  BookOpen,
  Languages,
  Timer,
  BookOpenText,
  Wrench,
  Layers,
  MessageCircle,
  Plane,
  RotateCcw,
  Shuffle,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import clsx from "clsx";
import {
  CATEGORY_INFO,
  SCENARIOS,
  characterName,
  scenarioLevel,
  type Scenario,
  type ScenarioCategory,
} from "@/content/scenarios";
import { voiceById } from "@/content/voices";
import { useHydrated, useLearner } from "@/lib/client/learner";
import { usePrefs } from "@/lib/client/prefs";
import { cardQueue, openSayMisses, rankedErrors, warmupItems } from "@/lib/learner/model";
import { STORIES } from "@/content/stories";
import { DECKS } from "@/content/decks";
import { PRONUNCIATION } from "@/content/pronunciation";
import { practiceSuggestions } from "@/lib/learner/recommend";
import { QUICK_REVIEW_MAX } from "./QuickReview";
import { HowItWorks } from "./HowItWorks";
import { Avatar } from "./Avatar";

type TrackId = "interview" | "work" | "abroad" | "everyday";

interface Track {
  id: TrackId;
  label: string;
  /** What finishing the track gives you, in one line. */
  builds: string;
  icon: LucideIcon;
  categories: ScenarioCategory[];
  /** Static class names, so Tailwind keeps them. */
  tone: { text: string; soft: string; solid: string; ink: string };
}

/**
 * Conversations grouped by goal, each with its own color and an order to follow. Interview
 * scenarios keep their written order (they build to the full mock); the others go from
 * shorter to longer.
 */
const TRACKS: readonly Track[] = [
  {
    id: "interview",
    label: "Job interview",
    builds: "The classic questions with a clear structure, then a full 15-minute mock.",
    icon: Briefcase,
    categories: ["interview"],
    tone: { text: "text-accent", soft: "bg-accent/15", solid: "bg-accent", ink: "text-white" },
  },
  {
    id: "work",
    label: "At work",
    builds: "Updates, meetings, feedback and tricky calls with colleagues and clients.",
    icon: Users,
    categories: ["work"],
    tone: { text: "text-accent-2", soft: "bg-accent-2/15", solid: "bg-accent-2", ink: "text-go-ink" },
  },
  {
    id: "abroad",
    label: "Life abroad",
    builds: "Get things done in English: travel, housing, health, banks and neighbors.",
    icon: Plane,
    categories: ["abroad"],
    tone: { text: "text-streak", soft: "bg-streak/15", solid: "bg-streak", ink: "text-go-ink" },
  },
  {
    id: "everyday",
    label: "Everyday talk",
    builds: "Talk about your life, then hold an opinion on bigger topics.",
    icon: MessageCircle,
    categories: ["free", "world"],
    tone: { text: "text-xp", soft: "bg-xp/15", solid: "bg-xp", ink: "text-go-ink" },
  },
];

function trackScenarios(track: Track): Scenario[] {
  const list = track.categories.flatMap((c) => SCENARIOS.filter((s) => s.category === c && !s.hidden));
  return track.id === "interview" ? list : [...list].sort((a, b) => a.minutes - b.minutes);
}

const TRACK_KEY = "sw_practice_track";

export function PracticeLibrary() {
  const state = useLearner();
  const hydrated = useHydrated();
  const [prefs] = usePrefs();
  const done = new Set(state.sessions.filter((s) => !s.demo && s.report?.task.completed).map((s) => s.scenarioId));
  const tutorName = voiceById(prefs.tutorVoiceId)?.displayName ?? "Your tutor";
  const due = hydrated ? warmupItems(state, new Date(), QUICK_REVIEW_MAX).length : 0;
  const cards = hydrated ? cardQueue(state, new Date()) : null;
  const cardsDue = cards ? cards.due.length + cards.fresh.length : 0;
  const sayMisses = hydrated ? openSayMisses(state).length : 0;
  const storiesNew = hydrated ? STORIES.filter((st) => !state.stories?.[st.id]).length : STORIES.length;
  const mistakes = hydrated ? rankedErrors(state).length : 0;

  const [trackId, setTrackId] = useState<TrackId>("interview");
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(TRACK_KEY);
      if (TRACKS.some((t) => t.id === saved)) setTrackId(saved as TrackId);
    } catch {
      // Storage unavailable: start on the first track.
    }
  }, []);
  function pickTrack(id: TrackId) {
    setTrackId(id);
    setShowAll(false);
    try {
      window.localStorage.setItem(TRACK_KEY, id);
    } catch {
      // Only a convenience.
    }
  }
  const track = TRACKS.find((t) => t.id === trackId)!;
  const scenarios = trackScenarios(track);
  const nextId = scenarios.find((s) => !done.has(s.id))?.id;
  // The list shows the next few; the rest is one tap away.
  const [showAll, setShowAll] = useState(false);
  const nextIndex = Math.max(
    0,
    scenarios.findIndex((s) => s.id === nextId),
  );
  const shown = showAll ? scenarios : scenarios.slice(Math.max(0, nextIndex - 1), nextIndex + 3);

  return (
    <div className="space-y-7">
      <h1 className="text-2xl font-black tracking-tight">Practice</h1>

      <div className="space-y-2">
        <p className="text-sm text-dim">
          Free practice. Your step-by-step plan is on{" "}
          <Link href="/" className="font-extrabold text-accent">
            Home
          </Link>
          . Not sure what to do? Start with the suggestion below: it comes from your last report and what is due today.
        </p>
        <HowItWorks
          steps={[
            "The suggestion at the top is the most useful thing right now. Tap “Something else” for the next one.",
            "Each exercise below says what you do and how long it takes. A small number means something is waiting today.",
            "Conversations are 5 to 15 minutes. Pick a goal, then a conversation. Numbered ones go from easier to harder.",
          ]}
          why="The plan keeps you moving forward; this is for the days you want more, or something specific."
        />
      </div>

      {hydrated && <Suggested state={state} />}

      <SkillGroup title="Speak">
        <SkillTile
          href="/say"
          icon={Languages}
          title="Say it in English"
          detail={sayMisses > 0 ? `${sayMisses} to say again` : "See Hebrew, say it in English · 3 min"}
          badge={sayMisses}
        />
        <SkillTile href="/talk" icon={Timer} title="One-minute talk" detail="Talk for a minute on a topic · 3 min" />
        <SkillTile
          href="/pronounce"
          icon={AudioLines}
          title="Pronunciation"
          detail={`${PRONUNCIATION.length} sounds · hear it, record yourself`}
        />
      </SkillGroup>

      <SkillGroup title="Words and listening">
        <SkillTile
          href="/words"
          icon={Layers}
          title="Word cards"
          detail={cardsDue > 0 ? `${cardsDue} for today` : `See the meaning, say the word · ${DECKS.length} packs`}
          badge={cardsDue}
        />
        <SkillTile
          href="/listen#stories"
          icon={BookOpenText}
          title="Stories"
          detail={storiesNew > 0 ? `Listen, answer 3 questions · ${storiesNew} new` : "Replay to beat your best"}
        />
        <SkillTile href="/read" icon={BookOpen} title="Short reads" detail="Read, tap a phrase for help · 4 min" />
        <SkillTile
          href="/listen"
          icon={Headphones}
          title="Listening gym"
          detail="Write what you hear, then repeat it · 3 min"
        />
        <SkillTile href="/phrases" icon={BookMarked} title="Phrase bank" detail="Everything you saved, to review" />
      </SkillGroup>

      <SkillGroup title="Fix your mistakes">
        <SkillTile
          href="/review"
          icon={RotateCcw}
          title="Quick review"
          detail={due > 0 ? `${due} due now · 2 min` : "Nothing due"}
          badge={due}
        />
        <SkillTile
          href="/mistakes"
          icon={Wrench}
          title="Your mistakes"
          detail={mistakes > 0 ? `${mistakes} to work on · rule and drill` : "Rule and drill"}
        />
      </SkillGroup>

      <section aria-labelledby="conv-title" className="space-y-3">
        <h2 id="conv-title" className="font-black">
          Conversations
        </h2>
        <div role="tablist" aria-label="Goals" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {TRACKS.map((t) => {
            const list = trackScenarios(t);
            const count = list.filter((s) => done.has(s.id)).length;
            const selected = t.id === trackId;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls="track-panel"
                onClick={() => pickTrack(t.id)}
                className={clsx(
                  "flex items-center gap-2 rounded-2xl border-2 p-2.5 text-left transition-colors",
                  selected ? "border-current bg-elev" : "border-line bg-elev-2 hover:border-line",
                  selected && t.tone.text,
                )}
              >
                <span className={clsx("grid size-8 shrink-0 place-items-center rounded-xl", t.tone.soft, t.tone.text)}>
                  <t.icon className="size-4" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className={clsx("block truncate text-sm font-extrabold", !selected && "text-text")}>
                    {t.label}
                  </span>
                  <span className="block text-xs font-bold text-faint">
                    {hydrated ? `${count}/${list.length}` : list.length} done
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div id="track-panel" role="tabpanel" aria-label={track.label} className="space-y-3">
          <div className={clsx("rounded-2xl p-4", track.tone.soft)}>
            <p className={clsx("flex items-center gap-2 font-black", track.tone.text)}>
              <track.icon className="size-5" aria-hidden />
              {track.label}
            </p>
            <p className="mt-1 text-sm font-bold text-dim">{track.builds}</p>
            <p className="mt-1 text-xs font-bold text-dim">Goal: {CATEGORY_INFO[track.categories[0]].goal}</p>
          </div>
          <ol className="space-y-2.5">
            {shown.map((s) => (
              <li key={s.id}>
                <ScenarioCard
                  scenario={s}
                  step={scenarios.indexOf(s) + 1}
                  done={done.has(s.id)}
                  next={hydrated && s.id === nextId}
                  tutorName={tutorName}
                  tone={track.tone}
                />
              </li>
            ))}
          </ol>
          {shown.length < scenarios.length && (
            <button type="button" onClick={() => setShowAll(true)} className="btn-3d btn-ghost w-full py-2.5 text-sm">
              Show all {scenarios.length} conversations
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

/** The one thing to do now, with the reason; "Something else" moves to the next idea. */
function Suggested({ state }: { state: ReturnType<typeof useLearner> }) {
  const list = practiceSuggestions(state);
  const [i, setI] = useState(0);
  const s = list[i % list.length];
  if (!s) return null;
  return (
    <section
      aria-labelledby="suggested-title"
      className="rounded-3xl bg-accent p-5 text-white"
      style={{ boxShadow: "0 6px 0 var(--accent-deep)" }}
    >
      <p id="suggested-title" className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider">
        <Sparkles className="size-4" aria-hidden /> Suggested for you
      </p>
      <p className="mt-1 text-xl font-black leading-tight">{s.title}</p>
      <p className="mt-1 text-sm font-bold">{s.why}</p>
      <div className="mt-4 flex items-center gap-3">
        <Link href={s.href} className="btn-3d btn-go flex flex-1 items-center justify-center gap-2 py-3 uppercase">
          Start · {s.minutes} min <ArrowRight className="size-4" aria-hidden />
        </Link>
        {list.length > 1 && (
          <button
            type="button"
            onClick={() => setI((v) => v + 1)}
            className="tap inline-flex items-center gap-1 text-sm font-extrabold"
          >
            <Shuffle className="size-4" aria-hidden /> Something else
          </button>
        )}
      </div>
    </section>
  );
}

function SkillGroup({ title, children }: { title: string; children: React.ReactNode[] }) {
  const id = `group-${title.toLowerCase().replace(/\W+/g, "-")}`;
  return (
    <section aria-labelledby={id} className="space-y-2.5">
      <h2 id={id} className="font-black">
        {title}
      </h2>
      {/* Two columns; an odd last tile takes the full row. */}
      <div className="grid grid-cols-2 gap-2.5 [&>*:last-child:nth-child(odd)]:col-span-2">{children}</div>
    </section>
  );
}

function SkillTile({
  href,
  icon: Icon,
  title,
  detail,
  badge = 0,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  detail: string;
  /** Something waiting today: shown as a small count on the icon. */
  badge?: number;
}) {
  return (
    <Link href={href} className="tile flex flex-col gap-2 p-3.5 transition-colors hover:border-accent/60">
      <span className="relative grid size-9 place-items-center rounded-xl bg-accent-soft text-accent">
        <Icon className="size-5" aria-hidden />
        {badge > 0 && (
          <span className="absolute -right-1.5 -top-1.5 grid min-w-5 place-items-center rounded-full bg-streak px-1 text-[11px] font-black text-white">
            {badge}
          </span>
        )}
      </span>
      <span>
        <span className="block font-extrabold leading-tight">{title}</span>
        <span className="block text-xs font-bold text-dim">{detail}</span>
      </span>
    </Link>
  );
}

function ScenarioCard({
  scenario,
  step,
  done,
  next,
  tutorName,
  tone,
}: {
  scenario: Scenario;
  step: number;
  done: boolean;
  next: boolean;
  tutorName: string;
  tone: Track["tone"];
}) {
  const voice = scenario.voiceId ? voiceById(scenario.voiceId) : null;
  const name = characterName(scenario) ?? voice?.displayName;
  const who = voice ? `${name} · ${voice.accent}` : `With ${tutorName}`;
  return (
    <Link
      href={`/session/${scenario.id}`}
      className={clsx(
        "tile flex items-center gap-3 p-3.5 transition-colors hover:border-accent/60",
        next && "border-current",
        next && tone.text,
      )}
    >
      <span
        className={clsx(
          "grid size-7 shrink-0 place-items-center rounded-full text-sm font-black",
          done ? "bg-go text-go-ink" : next ? clsx(tone.solid, tone.ink) : "bg-elev-2 text-dim",
        )}
        aria-label={done ? "Completed" : `Step ${step}`}
      >
        {done ? <Check className="size-4" strokeWidth={3} aria-hidden /> : step}
      </span>
      <Avatar name={name ?? tutorName} size={40} />
      <span className="min-w-0 flex-1 text-text">
        <span className="flex items-center gap-1.5 font-extrabold">
          {scenario.title}
          {next && (
            <span className={clsx("rounded-md px-1.5 py-0.5 text-[10px] font-black uppercase", tone.soft, tone.text)}>
              Next
            </span>
          )}
        </span>
        <span className="block text-sm text-dim">{scenario.summary}</span>
        <span className="mt-1 flex items-center gap-1 text-xs font-bold text-faint">
          {who} · <Clock className="size-3" aria-hidden /> {scenario.minutes} min
          {scenarioLevel(scenario) && <> · {scenarioLevel(scenario)}</>}
        </span>
      </span>
      <ArrowRight className="size-5 shrink-0 text-faint" aria-hidden />
    </Link>
  );
}
