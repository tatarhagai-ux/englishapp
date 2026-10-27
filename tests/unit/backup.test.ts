import { describe, expect, it } from "vitest";
import { initialState, type LearnerState, type SessionRecord } from "@/lib/learner/model";
import { backupSummary, parseBackup, restoreBackup } from "@/lib/learner/backup";
import { mergeStates } from "@/lib/learner/merge";

function session(id: string, startedAt: string): SessionRecord {
  return {
    id,
    scenarioId: "free-your-week",
    mode: "voice",
    startedAt,
    day: startedAt.slice(0, 10),
    turns: [{ role: "learner", text: "Hi" }],
    speakingSeconds: 30,
    stuckCount: 0,
    fixedAloud: [],
    xp: 10,
    costUsd: 0,
  } as SessionRecord;
}

const withSessions = (...s: SessionRecord[]): LearnerState => ({
  ...initialState(new Date("2026-10-01")),
  sessions: s,
});

describe("backup", () => {
  it("rejects files that aren't a backup", () => {
    expect(parseBackup("not json")).toEqual({ error: "not_json" });
    expect(parseBackup('{"hello":1}')).toEqual({ error: "not_backup" });
    expect(parseBackup('{"v":2,"sessions":[],"phrases":[],"errors":{}}')).toEqual({ error: "not_backup" });
  });

  it("reads an exported state back", () => {
    const s = withSessions(session("a", "2026-10-02T10:00:00Z"));
    const parsed = parseBackup(JSON.stringify(s));
    expect("state" in parsed && parsed.state.sessions).toHaveLength(1);
  });

  it("merges instead of replacing, so newer sessions stay", () => {
    const backup = withSessions(session("old", "2026-10-02T10:00:00Z"));
    const current = withSessions(session("new", "2026-10-20T10:00:00Z"));
    const out = restoreBackup(current, backup, new Date("2026-10-26T00:00:00Z"));
    expect(out.sessions.map((s) => s.id)).toEqual(["old", "new"]);
  });

  it("brings history back after Delete all, also through sync with another device", () => {
    const backup = withSessions(session("old", "2026-10-02T10:00:00Z"));
    const wiped: LearnerState = { ...initialState(new Date("2026-10-25")), resetAt: "2026-10-25T00:00:00Z" };
    const restored = restoreBackup(wiped, backup, new Date("2026-10-26T00:00:00Z"));
    expect(restored.sessions.map((s) => s.id)).toEqual(["old"]);
    // The server still holds the wiped copy with its reset marker.
    expect(mergeStates(restored, wiped).sessions.map((s) => s.id)).toEqual(["old"]);
    // A new Delete all after the restore wins again.
    const wipedAgain: LearnerState = { ...wiped, resetAt: "2026-10-27T00:00:00Z" };
    expect(mergeStates(restored, wipedAgain).sessions).toHaveLength(0);
  });

  it("summarizes what's inside", () => {
    expect(backupSummary(withSessions())).toBe("0 conversations, 0 phrases");
  });
});
