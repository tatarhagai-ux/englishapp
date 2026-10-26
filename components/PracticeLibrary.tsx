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
  Timer,
  BookOpenText,
  Wrench,
  Layers,
  MessageCircle,
  Plane,
  RotateCcw,
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
import { cardQueue, rankedErrors, warmupItems } from "@/lib/learner/model";
import { STORIES } from "@/content/stories";
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
    try {
      window.localStorage.setItem(TRACK_KEY, id);
    } catch {
      // Only a convenience.
    }
  }
  const track = TRACKS.find((t) => t.id === trackId)!;
  const scenarios = trackScenarios(track);
  const nextId = scenarios.find((s) => !done.has(s.id))?.id;

  return (
    <div className="space-y-7">
      <h1 className="text-2xl font-black tracking-tight">Practice</h1>

      <div className="space-y-2">
        <p className="text-sm text-dim">
          Free practice. Your step-by-step plan is on{" "}
          <Link href="/" className="font-extrabold text-accent">
            Home
          </Link>
          ; here you pick anything you like, and it all counts toward today&apos;s minutes.
        </p>
        <HowItWorks
          steps={[
            "Words, listening and mistake drills take 2 to 5 minutes each. A small number means something is waiting today.",
            "Conversations are 5 to 15 minutes. Pick a goal, then a conversation. Numbered ones go from easier to harder.",
            "Every conversation ends with a report: your top fixes to say again, and new phrases.",
          ]}
          why="The plan keeps you moving forward; this is for the days you want more, or something specific."
        />
      </div>

      <SkillGroup title="Speaking">
        <SkillTile href="/talk" icon={Timer} title="One-minute talk" detail="A topic card, a long answer" />
        <SkillTile href="/pronounce" icon={AudioLines} title="Pronunciation" detail="10 sounds · record yourself" />
      </SkillGroup>

      <SkillGroup title="Words">
        <SkillTile
          href="/words"
          icon={Layers}
          title="Word cards"
          detail={cardsDue > 0 ? `${cardsDue} for today` : "10 packs · say the word"}
          badge={cardsDue}
        />
        <SkillTile href="/phrases" icon={BookMarked} title="Phrase bank" detail="Everything you saved" />
      </SkillGroup>

      <SkillGroup title="Listening">
        <SkillTile
          href="/listen#stories"
          icon={BookOpenText}
          title="Stories"
          detail={storiesNew > 0 ? `${storiesNew} new · 3 questions each` : "Replay to beat your best"}
        />
        <SkillTile href="/listen" icon={Headphones} title="Listening gym" detail="Dictation and shadowing" />
      </SkillGroup>

      <SkillGroup title="Fix your mistakes">
        <SkillTile
          href="/review"
          icon={RotateCcw}
          title="Quick review"
          detail={due > 0 ? `${due} due now` : "Nothing due"}
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
            <p className="mt-1 text-xs font-bold text-faint">Goal: {CATEGORY_INFO[track.categories[0]].goal}</p>
          </div>
          <ol className="space-y-2.5">
            {scenarios.map((s, i) => (
              <li key={s.id}>
                <ScenarioCard
                  scenario={s}
                  step={i + 1}
                  done={done.has(s.id)}
                  next={hydrated && s.id === nextId}
                  tutorName={tutorName}
                  tone={track.tone}
                />
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
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
