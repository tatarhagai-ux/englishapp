import { CHALLENGES, challengeById, LEVEL_RANK, type Challenge } from "@/content/challenges";
import type { TutorLevel } from "./adapt";
import { isRealSession, type LearnerState } from "./model";

/** Recent challenges are not repeated: this many of the last conversations are skipped. */
const NO_REPEAT = 3;

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Challenges that fit this conversation and level, recent ones last. */
export function challengeOptions(state: LearnerState, opts: { level: TutorLevel; roleplay: boolean }): Challenge[] {
  const recent = state.sessions
    .filter(isRealSession)
    .slice(-NO_REPEAT)
    .map((s) => s.challenge)
    .filter(Boolean);
  const fits = CHALLENGES.filter(
    (c) => LEVEL_RANK[c.minLevel] <= LEVEL_RANK[opts.level] && (!opts.roleplay || c.roleplay),
  );
  return [...fits.filter((c) => !recent.includes(c.id)), ...fits.filter((c) => recent.includes(c.id))];
}

/**
 * Today's challenge: the same all day for the same conversation (so leaving and coming back
 * doesn't reshuffle it), different from the last few, and harder ones only when the tutor
 * level says he is ready. On a "stretch" level the harder half is preferred.
 */
export function pickChallenge(
  state: LearnerState,
  opts: { level: TutorLevel; roleplay: boolean; scenarioId: string; day: string },
): Challenge | undefined {
  const options = challengeOptions(state, opts);
  const recent = new Set(
    state.sessions
      .filter(isRealSession)
      .slice(-NO_REPEAT)
      .map((s) => s.challenge),
  );
  let fresh = options.filter((c) => !recent.has(c.id));
  if (opts.level === "stretch") {
    const hard = fresh.filter((c) => LEVEL_RANK[c.minLevel] >= LEVEL_RANK.steady);
    if (hard.length) fresh = hard;
  }
  const pool = fresh.length ? fresh : options;
  if (!pool.length) return undefined;
  return pool[hash(`${opts.day}|${opts.scenarioId}`) % pool.length];
}

/** The next option after this one, for "Another challenge". */
export function nextChallenge(
  state: LearnerState,
  current: string | undefined,
  opts: { level: TutorLevel; roleplay: boolean },
): Challenge | undefined {
  const options = challengeOptions(state, opts);
  if (!options.length) return undefined;
  const i = options.findIndex((c) => c.id === current);
  return options[(i + 1) % options.length];
}

/** The tutor's instruction for a challenge, or "" for none or an unknown id. */
export function challengeForTutor(id: string | undefined, roleplay: boolean): string {
  const c = challengeById(id);
  if (!c) return "";
  const how = roleplay ? c.roleplay : c.tutor;
  if (!how) return "";
  return `Today's challenge for him: "${c.task}" He has seen it before starting. ${how} Near the end, if he met it, tell him so in a few words.`;
}
