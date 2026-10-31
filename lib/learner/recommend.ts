import { SAY_MISSES_ID } from "@/content/say";
import { STORIES } from "@/content/stories";
import { cardQueue, isRealSession, openSayMisses, rankedErrors, warmupItems, type LearnerState } from "./model";
import { stepLinks } from "./steps";

export interface Suggestion {
  href: string;
  title: string;
  /** Why this, now, in his terms. */
  why: string;
  minutes: number;
}

/** A report's next steps count as fresh for this long. */
const REPORT_FRESH_DAYS = 3;

/**
 * What to practice next, best first. The order follows what makes speaking stick: first
 * what the tutor asked for after the last conversation, then sentences he missed, then
 * reviews that are due (spaced repetition only works when you show up on the day), and
 * new material last.
 */
export function practiceSuggestions(state: LearnerState, now = new Date()): Suggestion[] {
  const out: Suggestion[] = [];
  const add = (s: Suggestion) => {
    if (!out.some((o) => o.href === s.href)) out.push(s);
  };

  const last = state.sessions
    .filter((s) => isRealSession(s) && s.report)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];
  if (last && now.getTime() - Date.parse(last.startedAt) < REPORT_FRESH_DAYS * 86_400_000) {
    for (const step of stepLinks(last.report!.next_steps, state)) {
      add({
        href: step.href,
        title: step.label,
        why: step.why || "Your tutor suggested it after your last conversation.",
        minutes: 3,
      });
    }
  }

  const misses = openSayMisses(state).length;
  if (misses > 0) {
    add({
      href: `/say/${SAY_MISSES_ID}`,
      title: "Redo the sentences you missed",
      why: `${misses} sentence${misses === 1 ? "" : "s"} from Say it in English to get right this time.`,
      minutes: 3,
    });
  }

  const due = warmupItems(state, now, 8).length;
  if (due >= 3) {
    add({
      href: "/review",
      title: "Quick review",
      why: `${due} mistakes and phrases are due today. Reviewing on time is what keeps them.`,
      minutes: 2,
    });
  }

  const cards = cardQueue(state, now);
  if (cards.due.length > 0) {
    add({
      href: "/words",
      title: "Word cards",
      why: `${cards.due.length} card${cards.due.length === 1 ? "" : "s"} due. Say each word from its meaning.`,
      minutes: 4,
    });
  }

  const top = rankedErrors(state)[0];
  if (top && top.occurrences >= 2) {
    add({
      href: `/mistakes/${encodeURIComponent(top.key)}`,
      title: `Fix: ${top.title}`,
      why: `Your most frequent mistake lately (${top.occurrences} times). The rule, then a drill.`,
      minutes: 3,
    });
  }

  const story = STORIES.find((s) => !state.stories?.[s.id]);
  if (story) {
    add({
      href: `/listen/story/${story.id}`,
      title: `Listen: ${story.title}`,
      why: "A short story in natural English, then three questions.",
      minutes: 4,
    });
  }

  add({
    href: "/talk",
    title: "One-minute talk",
    why: "Speak for a full minute on a topic card. Long answers are where fluency grows.",
    minutes: 3,
  });
  return out;
}
