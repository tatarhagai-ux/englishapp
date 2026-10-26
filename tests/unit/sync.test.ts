import { describe, expect, it } from "vitest";
import {
  addPhrases,
  applyAnalysis,
  initialState,
  recordPronunciation,
  removePhrase,
  removeSession,
  reviewPhrase,
  type LearnerState,
  type SessionRecord,
} from "@/lib/learner/model";
import { mergeStates } from "@/lib/learner/merge";
import { syncOnce, type SyncStore } from "@/lib/sync/merge-store";
import { analysisSchema } from "@/lib/prompts/analyzer";

const T0 = new Date("2026-10-25T08:00:00Z");
const T1 = new Date("2026-10-25T12:00:00Z");
const T2 = new Date("2026-10-26T09:00:00Z");

function session(id: string, at: Date, over: Partial<SessionRecord> = {}): SessionRecord {
  return {
    id,
    scenarioId: "free-your-week",
    mode: "voice",
    startedAt: at.toISOString(),
    day: at.toISOString().slice(0, 10),
    turns: [
      { role: "tutor", text: "Hi?" },
      { role: "learner", text: "Hello", input: "voice" },
    ],
    speakingSeconds: 60,
    stuckCount: 0,
    fixedAloud: [],
    xp: 0,
    costUsd: 0,
    ...over,
  };
}

const base = initialState(T0);
const phrase = (s: LearnerState, text: string, at = T0) =>
  addPhrases(s, [{ text, meaningEn: "", meaningHe: "" }], undefined, at).state;

describe("mergeStates", () => {
  it("keeps sessions from both devices, once each, in time order", () => {
    const phone = { ...base, sessions: [session("a", T0), session("b", T1)] };
    const laptop = { ...base, sessions: [session("c", T2), session("a", T0)] };
    expect(mergeStates(phone, laptop).sessions.map((s) => s.id)).toEqual(["a", "b", "c"]);
  });

  it("prefers the copy of a session that got further", () => {
    const report = analysisSchema.parse({});
    const unfinished = session("a", T0);
    const done = session("a", T0, { endedAt: T1.toISOString(), report, xp: 30 });
    expect(mergeStates({ ...base, sessions: [unfinished] }, { ...base, sessions: [done] }).sessions[0].xp).toBe(30);
    expect(mergeStates({ ...base, sessions: [done] }, { ...base, sessions: [unfinished] }).sessions[0].xp).toBe(30);
  });

  it("is symmetric", () => {
    const phone = phrase({ ...base, sessions: [session("a", T0)], spend: { "2026-10": 1.2 } }, "touch base");
    const laptop = phrase({ ...base, sessions: [session("b", T1)], spend: { "2026-10": 0.4 } }, "circle back");
    expect(mergeStates(phone, laptop)).toEqual(mergeStates(laptop, phone));
  });

  it("merges phrases by text and keeps the more reviewed card", () => {
    const phone = reviewPhrase(phrase(base, "Touch base"), "Touch base", true, T1);
    const laptop = phrase(base, "touch base");
    const merged = mergeStates(laptop, phone);
    expect(merged.phrases).toHaveLength(1);
    expect(merged.phrases[0].card.reps).toBe(1);
  });

  it("doesn't bring back a phrase deleted on the other device, but keeps one re-added later", () => {
    const shared = phrase(base, "touch base");
    const deleted = removePhrase(shared, "touch base", T1);
    expect(mergeStates(shared, deleted).phrases).toHaveLength(0);
    const readded = phrase(deleted, "touch base", T2);
    expect(mergeStates(shared, readded).phrases).toHaveLength(1);
  });

  it("doesn't bring back a discarded session", () => {
    const shared = { ...base, sessions: [session("a", T0)] };
    expect(mergeStates(shared, removeSession(shared, "a")).sessions).toHaveLength(0);
  });

  it("takes mistake status from the copy that saw the latest conversation", () => {
    const used = analysisSchema.parse({ correct_uses: ["present_perfect_duration"] });
    const laptop = applyAnalysis({ ...base, sessions: [session("a", T1)] }, "a", used, T1);
    const merged = mergeStates(base, laptop);
    expect(merged.errors.present_perfect_duration.status).toBe("practicing");
    expect(mergeStates(laptop, base).errors.present_perfect_duration.status).toBe("practicing");
  });

  it("uses the larger monthly counters and the best pronunciation score", () => {
    const phone = recordPronunciation({ ...base, spend: { "2026-10": 2 } }, "w-v", 70);
    const laptop = recordPronunciation({ ...base, spend: { "2026-10": 1, "2026-09": 3 } }, "w-v", 85);
    const merged = mergeStates(phone, laptop);
    expect(merged.spend).toEqual({ "2026-10": 2, "2026-09": 3 });
    expect(merged.pronunciation?.["w-v"].best).toBe(85);
  });

  it("after Delete all, drops older data from the other device", () => {
    const old = phrase({ ...base, sessions: [session("a", T0)] }, "touch base");
    const wiped = { ...initialState(T1), resetAt: T1.toISOString() };
    const merged = mergeStates(old, wiped);
    expect(merged.sessions).toHaveLength(0);
    expect(merged.phrases).toHaveLength(0);
    expect(Object.keys(merged.errors)).toHaveLength(8);
    const later = { ...wiped, sessions: [session("b", T2)] };
    expect(mergeStates(old, later).sessions.map((s) => s.id)).toEqual(["b"]);
  });

  it("survives a JSON round trip like the stored copy", () => {
    const phone = reviewPhrase(phrase(base, "touch base"), "touch base", true, T1);
    const remote = JSON.parse(JSON.stringify(phone)) as LearnerState;
    expect(JSON.parse(JSON.stringify(mergeStates(phone, remote)))).toEqual(remote);
  });
});

function fakeStore(initial: LearnerState | null) {
  let doc = initial ? (JSON.parse(JSON.stringify(initial)) as LearnerState) : null;
  let pushes = 0;
  const store: SyncStore = {
    async pull() {
      return doc ? (JSON.parse(JSON.stringify(doc)) as LearnerState) : null;
    },
    async push(next) {
      pushes++;
      doc = JSON.parse(JSON.stringify(next)) as LearnerState;
    },
  };
  return {
    store,
    get doc() {
      return doc;
    },
    get pushes() {
      return pushes;
    },
  };
}

describe("syncOnce", () => {
  it("uploads the local copy the first time", async () => {
    const local = { ...base, sessions: [session("a", T0)] };
    const remote = fakeStore(null);
    await syncOnce(local, remote.store);
    expect(remote.doc?.sessions.map((s) => s.id)).toEqual(["a"]);
  });

  it("brings two devices to the same state", async () => {
    const remote = fakeStore(null);
    const phone = await syncOnce({ ...base, sessions: [session("a", T0)] }, remote.store);
    const laptop = await syncOnce({ ...base, sessions: [session("b", T1)] }, remote.store);
    const phoneAgain = await syncOnce(JSON.parse(JSON.stringify(phone)), remote.store);
    expect(laptop.sessions.map((s) => s.id)).toEqual(["a", "b"]);
    expect(phoneAgain.sessions.map((s) => s.id)).toEqual(["a", "b"]);
  });

  it("skips the upload when nothing changed", async () => {
    const local = JSON.parse(JSON.stringify({ ...base, sessions: [session("a", T0)] })) as LearnerState;
    const remote = fakeStore(local);
    await syncOnce(local, remote.store);
    expect(remote.pushes).toBe(0);
  });
});
