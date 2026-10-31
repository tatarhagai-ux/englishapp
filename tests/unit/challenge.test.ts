import { describe, expect, it } from "vitest";
import { CHALLENGES, LEVEL_RANK } from "@/content/challenges";
import { challengeForTutor, challengeOptions, nextChallenge, pickChallenge } from "@/lib/learner/challenge";
import { initialState, type SessionRecord } from "@/lib/learner/model";
import { buildTutorSystemPrompt } from "@/lib/prompts/tutor";
import { buildCoachMessages, parseCoach } from "@/lib/prompts/analyzer";
import { scenarioById } from "@/content/scenarios";

const free = scenarioById("free-your-week")!;
const hotel = scenarioById("abroad-hotel")!;

function withChallenges(ids: string[]) {
  const sessions: SessionRecord[] = ids.map((challenge, i) => ({
    id: `s${i}`,
    scenarioId: "free-your-week",
    mode: "voice",
    startedAt: `2026-10-0${i + 1}T10:00:00Z`,
    endedAt: `2026-10-0${i + 1}T10:10:00Z`,
    day: `2026-10-0${i + 1}`,
    turns: [{ role: "learner", text: "hello there" }],
    speakingSeconds: 60,
    stuckCount: 0,
    fixedAloud: [],
    xp: 0,
    costUsd: 0,
    challenge,
  }));
  return { ...initialState(), sessions };
}

describe("today's challenge", () => {
  const opts = { level: "steady" as const, roleplay: false, scenarioId: "free-your-week", day: "2026-10-31" };

  it("is the same all day for the same conversation, and changes with the day", () => {
    const s = initialState();
    expect(pickChallenge(s, opts)?.id).toBe(pickChallenge(s, opts)?.id);
    const days = new Set(
      Array.from({ length: 10 }, (_, i) => pickChallenge(s, { ...opts, day: `2026-11-${10 + i}` })?.id),
    );
    expect(days.size).toBeGreaterThan(2);
  });

  it("doesn't repeat the last three", () => {
    const recent = ["pushback", "dig-deeper", "curveball"];
    const s = withChallenges(recent);
    for (let d = 1; d <= 20; d++) {
      expect(recent).not.toContain(pickChallenge(s, { ...opts, day: `2026-12-${String(d).padStart(2, "0")}` })?.id);
    }
  });

  it("keeps hard ones for a stretch level and roleplay-only ones out of roleplays", () => {
    for (const c of challengeOptions(initialState(), { level: "easier", roleplay: false })) {
      expect(LEVEL_RANK[c.minLevel]).toBe(0);
    }
    for (const c of challengeOptions(initialState(), { level: "stretch", roleplay: true })) {
      expect(c.roleplay).toBeTruthy();
    }
    for (let d = 1; d <= 20; d++) {
      const c = pickChallenge(initialState(), {
        ...opts,
        level: "stretch",
        day: `2026-12-${String(d).padStart(2, "0")}`,
      });
      expect(LEVEL_RANK[c!.minLevel]).toBeGreaterThanOrEqual(1);
    }
  });

  it("'Another' cycles through every option", () => {
    const o = { level: "stretch" as const, roleplay: false };
    const seen = new Set<string>();
    let id: string | undefined;
    for (let i = 0; i < CHALLENGES.length; i++) {
      id = nextChallenge(initialState(), id, o)?.id;
      seen.add(id!);
    }
    expect(seen.size).toBe(CHALLENGES.length);
  });

  it("reaches the tutor, in character for roleplays, and the wrap-up judges it", () => {
    const base = { tutorName: "Ava", correctionMode: "gentle" as const, targetKeys: [], wrapUp: false };
    expect(buildTutorSystemPrompt({ ...base, scenario: free, challenge: "pushback" })).toContain(
      "respectfully disagree",
    );
    expect(buildTutorSystemPrompt({ ...base, scenario: hotel, challenge: "pushback" })).toContain("objections");
    expect(challengeForTutor("ban-basic-words", true)).toBe("");
    expect(challengeForTutor("made-up", false)).toBe("");
    const coach = buildCoachMessages(free, [], CHALLENGES[0])[0].content;
    expect(coach).toContain(CHALLENGES[0].task);
    expect(parseCoach('{"challenge":{"met":true,"note_en":"Two sentences every time."}}')?.challenge?.met).toBe(true);
    expect(buildCoachMessages(free, [])[0].content).not.toContain('"challenge"');
  });

  it("the tutor teaches in its own conversations and can open with a fresh line", () => {
    const base = { tutorName: "Ava", correctionMode: "gentle" as const, targetKeys: [], wrapUp: false };
    const own = buildTutorSystemPrompt({ ...base, scenario: free, opening: true });
    expect(own).toContain("You are a teacher, not only a friend");
    expect(own).toContain(free.opener);
    expect(own).toContain("Don't repeat the usual opening word for word");
    expect(buildTutorSystemPrompt({ ...base, scenario: hotel })).not.toContain("You are a teacher, not only a friend");
  });

  it("stronger words parse and stay capped", () => {
    const up = Array.from({ length: 5 }, (_, i) => ({ plain: `w${i}`, better: `b${i}` }));
    expect(parseCoach(JSON.stringify({ upgrades: up }))?.upgrades).toEqual([]);
    expect(parseCoach(JSON.stringify({ upgrades: up.slice(0, 2) }))?.upgrades[1]).toMatchObject({ better: "b1" });
  });
});
