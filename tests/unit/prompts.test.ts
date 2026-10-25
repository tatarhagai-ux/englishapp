import { describe, expect, it } from "vitest";
import { scenarioById } from "@/content/scenarios";
import { buildTutorSystemPrompt, STUCK_MARKER, toChatMessages, trimHistory } from "@/lib/prompts/tutor";
import { buildAnalyzerMessages, extractJson, parseAnalysis } from "@/lib/prompts/analyzer";
import { assistRequest, buildAssistMessages } from "@/lib/prompts/assist";
import type { Turn } from "@/lib/conversation/types";

const free = scenarioById("free-your-week")!;
const interview = scenarioById("interview-about-you")!;

describe("tutor prompt", () => {
  it("uses the tutor persona for free talk and the role for roleplays", () => {
    const a = buildTutorSystemPrompt({
      scenario: free,
      tutorName: "Ryan",
      correctionMode: "gentle",
      targetKeys: [],
      wrapUp: false,
    });
    expect(a).toContain("You are Ryan, Hagai's personal English speaking coach");
    const b = buildTutorSystemPrompt({
      scenario: interview,
      tutorName: "Ryan",
      correctionMode: "gentle",
      targetKeys: [],
      wrapUp: false,
    });
    expect(b).toContain("You are playing Daniel");
    expect(b).not.toContain("You are Ryan");
  });

  it("switches correction rules by mode", () => {
    const p = (m: "off" | "gentle" | "precise") =>
      buildTutorSystemPrompt({ scenario: free, tutorName: "Ava", correctionMode: m, targetKeys: [], wrapUp: false });
    expect(p("off")).toContain("Do not correct mistakes at all");
    expect(p("gentle")).toContain("reuse the correct form");
    expect(p("precise")).toContain("Quick fix:");
  });

  it("injects targets and the wrap-up instruction", () => {
    const p = buildTutorSystemPrompt({
      scenario: free,
      tutorName: "Ava",
      correctionMode: "gentle",
      targetKeys: ["present_perfect_duration", "not_a_key"],
      wrapUp: true,
    });
    expect(p).toContain("I've been living in Shoham for ten years.");
    expect(p).toContain("Time is up");
    expect(p).toContain(STUCK_MARKER);
  });

  it("maps turns to chat roles and marks stuck turns", () => {
    const history: Turn[] = [
      { role: "tutor", text: "Hi! How's your week?" },
      { role: "learner", text: "אני לא יודע איך להגיד", input: "stuck" },
    ];
    const msgs = toChatMessages("SYS", history);
    expect(msgs.map((m) => m.role)).toEqual(["system", "assistant", "user"]);
    expect(msgs[2].content.startsWith(STUCK_MARKER)).toBe(true);
  });

  it("trims long histories but keeps the opener", () => {
    const history: Turn[] = Array.from({ length: 40 }, (_, i) => ({
      role: i % 2 === 0 ? "tutor" : "learner",
      text: `turn ${i}`,
    }));
    const t = trimHistory(history, 10);
    expect(t).toHaveLength(10);
    expect(t[0].text).toBe("turn 0");
    expect(t[9].text).toBe("turn 39");
  });
});

describe("analyzer", () => {
  it("includes criteria, known keys and the transcript", () => {
    const [sys, user] = buildAnalyzerMessages(interview, [
      { role: "tutor", text: interview.opener },
      { role: "learner", text: "I work in the army two years", input: "voice" },
    ]);
    expect(sys.content).toContain("present_perfect_duration");
    expect(user.content).toContain("Says why they want this kind of role");
    expect(user.content).toContain("LEARNER: I work in the army two years");
  });

  it("extracts JSON from fences and prose", () => {
    expect(extractJson('```json\n{"a":1}\n```')).toEqual({ a: 1 });
    expect(extractJson('Sure! Here it is: {"a":2} hope it helps')).toEqual({ a: 2 });
    expect(extractJson("no json here")).toBeNull();
  });

  it("parses, normalizes keys, drops no-op fixes, and keeps the top 3 by severity", () => {
    const raw = JSON.stringify({
      corrections: [
        { original: "a", better: "a", why_en: "same", error_key: "x" },
        {
          original: "I study two weeks",
          better: "I've been studying for two weeks",
          why_en: "duration",
          error_key: "Present Perfect Duration",
          severity: "3",
        },
        { original: "at the internet", better: "online", why_en: "prep", error_key: "prepositions", severity: 1 },
        { original: "b1", better: "b2", why_en: "w", error_key: "k1", severity: 2 },
        { original: "c1", better: "c2", why_en: "w", error_key: "k2", severity: 2 },
      ],
      task: { completed: true, met: ["x"] },
      unexpected: "ignored",
    });
    const a = parseAnalysis(raw)!;
    expect(a.corrections).toHaveLength(3);
    expect(a.corrections[0].error_key).toBe("present_perfect_duration");
    expect(a.corrections[0].severity).toBe(3);
    expect(a.corrections.some((c) => c.original === "a")).toBe(false);
    expect(a.task.completed).toBe(true);
    expect(a.phrases).toEqual([]);
  });

  it("returns null for unusable output", () => {
    expect(parseAnalysis("I can't do that")).toBeNull();
    expect(parseAnalysis('{"corrections":[{"original":""}]}')).toBeNull();
  });
});

describe("assist", () => {
  it("validates modes", () => {
    expect(assistRequest.safeParse({ mode: "better", text: "I live here for ten years" }).success).toBe(true);
    expect(assistRequest.safeParse({ mode: "nope", text: "x" }).success).toBe(false);
    expect(assistRequest.safeParse({ mode: "hint", history: [], task: "x" }).success).toBe(false);
  });

  it("builds a hint prompt from the last turns", () => {
    const msgs = buildAssistMessages({
      mode: "hint",
      task: "Talk about your week",
      history: [{ role: "tutor", text: "What have you been up to?" }],
    });
    expect(msgs[1].content).toContain("OTHER PERSON: What have you been up to?");
  });
});
