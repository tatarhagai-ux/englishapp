import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ChatRequest as LlmChatRequest, ChatStreamEvent } from "@/lib/providers/llm/types";

// A scripted fake LLM: tests set what stream() yields and what complete() returns.
const fake = {
  streamEvents: [] as ChatStreamEvent[],
  streamError: null as Error | null,
  completions: [] as string[],
  /** Replies to the teacher's wrap-up call in /api/analyze, which runs alongside the fixes. */
  coach: [] as string[],
  calls: [] as LlmChatRequest[],
};

vi.mock("@/lib/providers/llm", () => ({
  llm: () => ({
    name: "fake",
    async *stream(req: LlmChatRequest) {
      fake.calls.push(req);
      if (fake.streamError) throw fake.streamError;
      for (const ev of fake.streamEvents) yield ev;
    },
    async complete(req: LlmChatRequest) {
      const isCoach = String(req.messages[0]?.content).includes("Write your wrap-up");
      if (!isCoach) fake.calls.push(req);
      const text = (isCoach ? fake.coach : fake.completions).shift() ?? "";
      return { text, usage: { promptTokens: 10, completionTokens: 5 } };
    },
  }),
}));

function post(body: unknown) {
  return new Request("http://local/api", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function ndjson(res: Response) {
  const text = await res.text();
  return text
    .trim()
    .split("\n")
    .map((l) => JSON.parse(l));
}

const history = [
  { role: "tutor", text: "Hey! So, what have you been up to this week?" },
  { role: "learner", text: "I study for AZ-900 two weeks", input: "voice" },
];

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("OPENROUTER_API_KEY", "sk-or-test-1234567890");
  fake.streamEvents = [];
  fake.streamError = null;
  fake.completions = [];
  fake.coach = [];
  fake.calls = [];
});
afterEach(() => vi.unstubAllEnvs());

describe("POST /api/chat", () => {
  it("writes a fresh opening line from an empty history", async () => {
    fake.streamEvents = [{ type: "delta", text: "Hi Hagai!" }, { type: "done" }];
    const { POST } = await import("@/app/api/chat/route");
    const res = await POST(post({ scenarioId: "free-your-week", history: [], opening: true, challenge: "pushback" }));
    expect(res.status).toBe(200);
    const sent = fake.calls[0];
    expect(sent.messages).toHaveLength(2);
    expect(sent.messages[1]).toMatchObject({ role: "user" });
    expect(sent.messages[0].content).toContain("very start of the conversation");
    expect(sent.messages[0].content).toContain("Today's challenge for him");
  });

  it("streams NDJSON deltas and a done line with usage", async () => {
    fake.streamEvents = [
      { type: "delta", text: "Oh nice, so you've been " },
      { type: "delta", text: "studying for two weeks!" },
      { type: "done", usage: { promptTokens: 900, completionTokens: 20 } },
    ];
    const { POST } = await import("@/app/api/chat/route");
    const res = await POST(post({ scenarioId: "free-your-week", history, targetKeys: ["present_perfect_duration"] }));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("ndjson");
    const lines = await ndjson(res);
    expect(
      lines
        .filter((l) => l.t === "delta")
        .map((l) => l.text)
        .join(""),
    ).toBe("Oh nice, so you've been studying for two weeks!");
    expect(lines.at(-1)).toMatchObject({
      t: "done",
      model: "deepseek/deepseek-v4-flash",
      usage: { promptTokens: 900 },
    });
    const sent = fake.calls[0];
    expect(sent.messages[0].role).toBe("system");
    expect(sent.messages[0].content).toContain("I've been living in Shoham");
    expect(sent.maxTokens).toBeLessThanOrEqual(200);
  });

  it("rejects bad input and unknown scenarios", async () => {
    const { POST } = await import("@/app/api/chat/route");
    expect((await POST(post({ scenarioId: "free-your-week", history: [{ role: "x", text: "" }] }))).status).toBe(400);
    expect((await POST(post({ scenarioId: "nope", history }))).status).toBe(400);
  });

  it("returns a real HTTP error when the provider fails before streaming", async () => {
    // Import after resetModules so the route and the test share one ProviderError class.
    const { ProviderError } = await import("@/lib/providers/errors");
    fake.streamError = new ProviderError("openrouter", 429, "rate limited");
    const { POST } = await import("@/app/api/chat/route");
    const res = await POST(post({ scenarioId: "free-your-week", history }));
    expect(res.status).toBe(429);
  });

  it("returns 503 when no LLM key is configured", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "");
    const { POST } = await import("@/app/api/chat/route");
    const res = await POST(post({ scenarioId: "free-your-week", history }));
    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({ error: "not_configured", service: "OpenRouter" });
  });
});

describe("POST /api/analyze", () => {
  const good = JSON.stringify({
    corrections: [
      {
        original: "I study for AZ-900 two weeks",
        better: "I've been studying for AZ-900 for two weeks",
        why_en: "Use the present perfect for something that started in the past and continues.",
        why_he: "משתמשים בהווה מושלם לדבר שהתחיל בעבר ונמשך.",
        error_key: "present_perfect_duration",
        severity: 3,
      },
    ],
    task: { completed: false, met: [], feedback_en: "Add a plan for next week." },
    praise_en: "Clear and direct.",
  });

  it("returns the parsed analysis", async () => {
    fake.completions = [good];
    const { POST } = await import("@/app/api/analyze/route");
    const res = await POST(post({ scenarioId: "free-your-week", history }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.analysis.corrections[0].error_key).toBe("present_perfect_duration");
    expect(fake.calls[0].json).toBe(true);
  });

  it("adds the teacher's wrap-up from its own call, and counts both calls' usage", async () => {
    fake.completions = [good];
    fake.coach = [
      JSON.stringify({
        score: { fluency: 60, accuracy: 55, range: 50, task: 70, note_en: "Short answers." },
        felt_en: "You flowed on work.",
        homework: { task_en: "Three sentences with since." },
        next_steps: [{ kind: "say", target: "for-and-since" }],
      }),
    ];
    const { POST } = await import("@/app/api/analyze/route");
    const json = await (await POST(post({ scenarioId: "free-your-week", history }))).json();
    expect(json.analysis.corrections).toHaveLength(1);
    expect(json.analysis.score.fluency).toBe(60);
    expect(json.analysis.homework.task_en).toBe("Three sentences with since.");
    expect(json.usage.promptTokens).toBe(20);
  });

  it("still returns the fixes when the wrap-up fails", async () => {
    fake.completions = [good];
    fake.coach = ["not json", "still not json"];
    const { POST } = await import("@/app/api/analyze/route");
    const res = await POST(post({ scenarioId: "free-your-week", history }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.analysis.corrections).toHaveLength(1);
    expect(json.analysis.score).toBeUndefined();
  });

  it("retries once when the first reply is not valid JSON", async () => {
    fake.completions = ["Sorry, here is my analysis in prose.", good];
    fake.coach = ["{}"];
    const { POST } = await import("@/app/api/analyze/route");
    const res = await POST(post({ scenarioId: "free-your-week", history }));
    expect(res.status).toBe(200);
    expect(fake.calls).toHaveLength(2);
    // Two tries for the fixes plus one for the wrap-up.
    expect((await res.json()).usage.promptTokens).toBe(30);
  });

  it("gives up with 502 after two bad replies", async () => {
    fake.completions = ["nope", "still nope"];
    const { POST } = await import("@/app/api/analyze/route");
    expect((await POST(post({ scenarioId: "free-your-week", history }))).status).toBe(502);
  });

  it("refuses a conversation with no learner turns", async () => {
    const { POST } = await import("@/app/api/analyze/route");
    const res = await POST(post({ scenarioId: "free-your-week", history: [history[0]] }));
    expect(res.status).toBe(400);
  });
});

describe("POST /api/assist", () => {
  it("returns validated helper output", async () => {
    fake.completions = [
      '{"better":"I\'ve been studying for two weeks.","why_en":"Present perfect for duration.","why_he":"..."}',
    ];
    const { POST } = await import("@/app/api/assist/route");
    const res = await POST(post({ mode: "better", text: "I study two weeks" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ better: "I've been studying for two weeks." });
  });

  it("rejects model output that does not match the mode", async () => {
    fake.completions = ['{"something":"else"}'];
    const { POST } = await import("@/app/api/assist/route");
    expect((await POST(post({ mode: "translate", text: "touch base" }))).status).toBe(502);
  });
});
