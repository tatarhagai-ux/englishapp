import { expect, test, type Page, type Route } from "@playwright/test";

/** 0.1 s of silent 8 kHz mono WAV, so the audio queue really plays and finishes. */
function silentWav(): Buffer {
  const samples = 800;
  const b = Buffer.alloc(44 + samples);
  b.write("RIFF", 0);
  b.writeUInt32LE(36 + samples, 4);
  b.write("WAVE", 8);
  b.write("fmt ", 12);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);
  b.writeUInt16LE(1, 22);
  b.writeUInt32LE(8000, 24);
  b.writeUInt32LE(8000, 28);
  b.writeUInt16LE(1, 32);
  b.writeUInt16LE(8, 34);
  b.write("data", 36);
  b.writeUInt32LE(samples, 40);
  b.fill(128, 44);
  return b;
}

const ANALYSIS = {
  corrections: [
    {
      original: "I study for AZ-900 two weeks",
      better: "I've been studying for AZ-900 for two weeks",
      why_en: "Use the present perfect for something that started in the past and is still going.",
      why_he: "משתמשים ב-present perfect לדבר שהתחיל בעבר ועדיין נמשך.",
      error_key: "present_perfect_duration",
      category: "grammar",
      severity: 3,
    },
  ],
  other_errors: [],
  correct_uses: ["study_for"],
  phrases: [{ text: "Lately I've been…", meaning_en: "Talking about recent activity", meaning_he: "לאחרונה אני…" }],
  task: { completed: true, met: ["Talks about at least one future plan"], feedback_en: "Good plan for next week." },
  praise_en: "You kept the conversation going.",
  memory: ["He has an AZ-900 exam next month."],
};

/** Fresh learners have warm-up items (placement mistakes); most tests skip straight past them. */
async function startSkippingWarmup(page: Page) {
  await page.getByRole("button", { name: /start/i }).click();
  const skip = page.getByRole("button", { name: "Skip" });
  if (await skip.isVisible().catch(() => false)) await skip.click();
}

async function mockApis(page: Page, chatBodies: unknown[]) {
  await page.route("**/api/tts", (route: Route) =>
    route.fulfill({ status: 200, contentType: "audio/wav", body: silentWav() }),
  );
  await page.route("**/api/chat", async (route: Route) => {
    chatBodies.push(route.request().postDataJSON());
    const lines = [
      { t: "delta", text: "Oh nice, so you've been studying for two weeks. " },
      { t: "delta", text: "What's the hardest part so far?" },
      { t: "done", model: "deepseek/deepseek-v3.2", usage: { promptTokens: 1000, completionTokens: 30 } },
    ];
    await route.fulfill({
      status: 200,
      contentType: "application/x-ndjson",
      body: lines.map((l) => JSON.stringify(l)).join("\n") + "\n",
    });
  });
  await page.route("**/api/analyze", (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        analysis: ANALYSIS,
        model: "deepseek/deepseek-v3.2",
        usage: { promptTokens: 2000, completionTokens: 400 },
      }),
    }),
  );
}

test("a quiet-mode conversation produces a report and updates progress", async ({ page }) => {
  const chatBodies: { history: { role: string; text: string; input?: string }[]; targetKeys: string[] }[] = [];
  await mockApis(page, chatBodies);

  await page.goto("/session/free-your-week");
  await expect(page.getByRole("heading", { name: "Your week" })).toBeVisible();
  await expect(page.getByText("Talk about what you've been doing lately")).toBeVisible();
  await page.getByRole("button", { name: /Quiet mode/ }).click();
  await startSkippingWarmup(page);

  await expect(page.getByText("Hey! So, what have you been up to this week?")).toBeVisible();
  const box = page.getByLabel("Your reply");
  await expect(page.getByRole("button", { name: "Send" })).toBeDisabled();
  await box.fill("I study for AZ-900 two weeks");
  await box.press("Enter");

  await expect(page.getByText("What's the hardest part so far?")).toBeVisible();
  expect(chatBodies).toHaveLength(1);
  expect(chatBodies[0].history.at(-1)).toMatchObject({
    role: "learner",
    text: "I study for AZ-900 two weeks",
    input: "text",
  });
  expect(chatBodies[0].targetKeys.length).toBeGreaterThan(0);

  // "I'm stuck" in quiet mode: type Hebrew, it goes out marked as stuck.
  await page.getByRole("button", { name: "I'm stuck" }).click();
  const heBox = page.getByLabel("Write it in Hebrew");
  await heBox.fill("אני רוצה לעבור את המבחן בחודש הבא");
  await heBox.press("Enter");
  await expect(page.locator('p[lang="he"]').filter({ hasText: "אני רוצה לעבור" })).toHaveAttribute("dir", "rtl");
  await expect.poll(() => chatBodies.length).toBe(2);
  expect(chatBodies[1].history.at(-1)).toMatchObject({ input: "stuck" });

  await page.getByRole("button", { name: "End conversation" }).click();
  await expect(page).toHaveURL(/\/report\//);
  await expect(page.getByText("Mission complete!")).toBeVisible();
  await expect(page.getByText("I've been studying for AZ-900 for two weeks")).toBeVisible();
  await page.getByRole("button", { name: "Translate" }).first().click();
  await expect(page.getByText("משתמשים ב-present perfect")).toBeVisible();
  await expect(page.getByText("Saved to your phrase bank")).toBeVisible();
  await expect(page.getByText("Your tutor will remember:")).toBeVisible();
  await expect(page.getByRole("link", { name: /Up next/ })).toBeVisible();
  await expect(page.getByLabel(/XP earned/)).toContainText("+");
  await expect(page.getByRole("list", { name: "Session stats" }).or(page.getByLabel("Session stats"))).toContainText(
    "“I'm stuck”",
  );

  await page.getByRole("link", { name: "Continue" }).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("link", { name: /Last report/ })).toBeVisible();

  await page.goto("/progress");
  await expect(page.getByRole("heading", { name: "Recent conversations" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Your week/ })).toBeVisible();
  await expect(page.getByText("Phrases saved").locator("..")).toContainText("1");

  // Continuity: the fact from the report is listed in settings and sent to the tutor next time.
  await page.goto("/settings");
  const memory = page.getByRole("region", { name: "What your tutor remembers" });
  await expect(memory).toContainText("He has an AZ-900 exam next month.");
  await page.goto("/session/free-ai-tools");
  await page.getByRole("button", { name: /Quiet mode/ }).click();
  await startSkippingWarmup(page);
  await page.getByLabel("Your reply").fill("I use Claude every day");
  await page.getByLabel("Your reply").press("Enter");
  await expect.poll(() => chatBodies.length).toBe(3);
  expect((chatBodies[2] as unknown as { memory: string[] }).memory).toEqual(["He has an AZ-900 exam next month."]);
});

test("ending before saying anything discards the session", async ({ page }) => {
  await mockApis(page, []);
  await page.goto("/session/free-your-week");
  await page.getByRole("button", { name: /Quiet mode/ }).click();
  await startSkippingWarmup(page);
  await expect(page.getByText("Hey! So, what have you been up to this week?")).toBeVisible();
  await page.getByRole("button", { name: "End conversation" }).click();
  await expect(page).toHaveURL("/practice");
  await page.goto("/progress");
  await expect(page.getByRole("heading", { name: "Recent conversations" })).toHaveCount(0);
});

test("a chat failure shows a retry that works", async ({ page }) => {
  let fail = true;
  await page.route("**/api/tts", (route) =>
    route.fulfill({ status: 200, contentType: "audio/wav", body: silentWav() }),
  );
  await page.route("**/api/chat", (route) => {
    if (fail) {
      fail = false;
      return route.fulfill({ status: 429, contentType: "application/json", body: '{"error":"provider_error"}' });
    }
    return route.fulfill({
      status: 200,
      contentType: "application/x-ndjson",
      body:
        JSON.stringify({ t: "delta", text: "Got it, tell me more?" }) +
        "\n" +
        JSON.stringify({ t: "done", model: "m", usage: null }) +
        "\n",
    });
  });
  await page.goto("/session/free-your-week");
  await page.getByRole("button", { name: /Quiet mode/ }).click();
  await startSkippingWarmup(page);
  const box = page.getByLabel("Your reply");
  await box.fill("Hello there");
  await box.press("Enter");
  const alert = page.getByRole("alert").filter({ hasText: "busy" });
  await expect(alert).toBeVisible();
  await alert.getByRole("button", { name: "Retry" }).click();
  await expect(page.getByText("Got it, tell me more?")).toBeVisible();
});

test("practice library lists every category and opens a scenario", async ({ page }) => {
  await page.goto("/practice");
  for (const h of ["Job interview", "Free talk", "At work", "Life abroad", "World & ideas"]) {
    await expect(page.getByRole("heading", { name: h })).toBeVisible();
  }
  await expect(page.getByText("Recommended for you")).toBeVisible();
  await page.getByRole("link", { name: /Problem at the airport/ }).click();
  await expect(page.getByRole("heading", { name: "Problem at the airport" })).toBeVisible();
  await expect(page.getByText("Kate · Australian accent")).toBeVisible();
  await expect(page.getByText(/talking with Kate, a busy/)).toBeVisible();
});

test("warm-up: recall the correct sentence by typing, then the conversation starts", async ({ page }) => {
  await mockApis(page, []);
  // The first conversation goes straight in: nothing to review yet.
  await page.goto("/session/work-standup");
  await page.getByRole("button", { name: /Quiet mode/ }).click();
  await page.getByRole("button", { name: "Start conversation" }).click();
  await page.getByLabel("Your reply").fill("Yesterday I finished the report");
  await page.getByLabel("Your reply").press("Enter");
  await expect(page.getByText("What's the hardest part so far?")).toBeVisible();
  await page.getByRole("button", { name: "End conversation" }).click();
  await expect(page).toHaveURL(/\/report\//);

  await page.goto("/session/free-your-week");
  await page.getByRole("button", { name: /Quiet mode/ }).click();
  // Up to three items, now that there is a conversation to review.
  await page.getByRole("button", { name: /Warm up \(3\) & start/ }).click();

  await expect(page.getByText("Earlier you said:")).toBeVisible();
  await expect(page.getByText("I live in Shoham for ten years.")).toBeVisible();
  // The answer is hidden until he tries.
  await expect(page.getByText("I've been living in Shoham for ten years.")).toHaveCount(0);
  await page.getByLabel("Your answer").fill("I have been living in Shoham for ten years");
  await page.getByRole("button", { name: "Check" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Correct" })).toBeVisible();
  await page.getByRole("button", { name: "Next" }).click();

  await expect(page.getByText("I'm looking forward to meet you.")).toBeVisible();
  await page.getByRole("button", { name: "Show me the answer" }).click();
  await expect(page.getByText("I'm looking forward to meeting you.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
  await page.getByRole("button", { name: "Next" }).click();
  // Skipping the last item goes straight into the conversation.
  await expect(page.getByLabel("Item 3 of 3")).toBeVisible();
  await page.getByRole("button", { name: "Skip" }).click();

  await expect(page.getByText("Hey! So, what have you been up to this week?")).toBeVisible();

  // Those two are scheduled for later; the next visit warms up on the next two mistakes.
  await page.goto("/session/interview-about-you");
  await page.getByRole("button", { name: /Quiet mode/ }).click();
  await page.getByRole("button", { name: /Warm up \(\d\)/ }).click();
  await expect(page.getByText("An Azure exam that called AZ-900.")).toBeVisible();
});

test("without Azure the tutor speaks with the browser's voice and the conversation flows", async ({ page }) => {
  // A fake speechSynthesis that records what it was asked to say and "finishes" right away.
  await page.addInitScript(() => {
    const said: string[] = [];
    (window as unknown as { __said: string[] }).__said = said;
    const synth = {
      // The real utterance only accepts genuine voice objects, so offer none.
      getVoices: () => [],
      speak(u: SpeechSynthesisUtterance) {
        if (u.text) said.push(u.text);
        setTimeout(() => u.onend?.(new Event("end") as SpeechSynthesisEvent), 20);
      },
      cancel() {},
      addEventListener() {},
    };
    Object.defineProperty(window, "speechSynthesis", { value: synth });
  });
  const chatBodies: unknown[] = [];
  await mockApis(page, chatBodies);
  await page.route("**/api/tts", (route: Route) =>
    route.fulfill({ status: 503, contentType: "application/json", body: '{"error":"not_configured"}' }),
  );

  await page.goto("/session/free-your-week");
  await page.getByRole("button", { name: /Quiet mode/ }).click();
  await startSkippingWarmup(page);
  await expect(page.getByText("Hey! So, what have you been up to this week?")).toBeVisible();
  const said = () => page.evaluate(() => (window as unknown as { __said: string[] }).__said);
  await expect.poll(said).toContain("Hey! So, what have you been up to this week?");

  const box = page.getByLabel("Your reply");
  await box.fill("I study for AZ-900 two weeks");
  await box.press("Enter");
  await expect(page.getByText("What's the hardest part so far?")).toBeVisible();
  await expect.poll(said).toContain("What's the hardest part so far?");
  await expect(page.getByRole("alert").filter({ hasText: /voice|Azure/i })).toHaveCount(0);

  await box.fill("Remembering all the service names");
  await box.press("Enter");
  await expect.poll(() => chatBodies.length).toBe(2);
});

test("tap to talk: speak with pauses, check and fix the text, then send; hands-free waits for silence", async ({
  page,
}) => {
  // A fake microphone and browser recognizer the test drives (Azure isn't configured here).
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "mediaDevices", {
      value: { getUserMedia: async () => ({ getTracks: () => [] }) },
    });
    type Handler = ((e: unknown) => void) | null;
    class FakeRecognition {
      lang = "";
      continuous = false;
      interimResults = false;
      onresult: Handler = null;
      onerror: Handler = null;
      onend: (() => void) | null = null;
      start() {
        (window as unknown as { __rec: FakeRecognition }).__rec = this;
      }
      stop() {}
      abort() {}
    }
    Object.assign(window, { SpeechRecognition: FakeRecognition });
  });
  const chatBodies: { history: { role: string; text: string; input?: string }[] }[] = [];
  await mockApis(page, chatBodies);
  // Waits for the recognizer to start (it first asks Azure, which answers "not configured").
  const say = (text: string) =>
    page
      .waitForFunction(() => "__rec" in window)
      .then(() =>
        page.evaluate((t) => {
          const rec = (window as unknown as { __rec: { onresult: (e: unknown) => void } }).__rec;
          rec.onresult({ resultIndex: 0, results: [Object.assign([{ transcript: t }], { isFinal: true })] });
        }, text),
      );
  const freshListen = () => page.evaluate(() => delete (window as unknown as { __rec?: unknown }).__rec);

  await page.goto("/session/free-your-week");
  await startSkippingWarmup(page);
  await expect(page.getByText("Hey! So, what have you been up to this week?")).toBeVisible();
  await expect(page.getByRole("button", { name: "Tap to talk" })).toBeVisible();

  // Pauses between phrases don't send anything.
  await freshListen();
  await page.getByRole("button", { name: "Start talking" }).click();
  await say("I study for AZ-900");
  await say("two weeks");
  await page.waitForTimeout(3000);
  expect(chatBodies).toHaveLength(0);

  // Stop, check, add more, fix a word, send.
  await page.getByRole("button", { name: "Done talking" }).click();
  const heard = page.getByLabel(/^Heard/);
  await expect(heard).toHaveValue("I study for AZ-900 two weeks");
  await freshListen();
  await page.getByRole("button", { name: "Keep talking" }).click();
  await say("and it's hard");
  await page.getByRole("button", { name: "Done talking" }).click();
  await expect(heard).toHaveValue("I study for AZ-900 two weeks and it's hard");
  await heard.fill("I've been studying for AZ-900 for two weeks and it's hard");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect.poll(() => chatBodies.length).toBe(1);
  expect(chatBodies[0].history.at(-1)).toMatchObject({
    role: "learner",
    text: "I've been studying for AZ-900 for two weeks and it's hard",
    input: "voice",
  });

  // Hands-free: listening starts by itself and the turn goes out after a real silence.
  await expect(page.getByText("What's the hardest part so far?")).toBeVisible();
  await page.getByRole("button", { name: "Tap to talk" }).click();
  await expect(page.getByRole("button", { name: "Hands-free" })).toBeVisible();
  await freshListen();
  await page.getByRole("button", { name: "Start talking" }).click();
  await say("Remembering");
  await say("all the service names");
  await expect.poll(() => chatBodies.length, { timeout: 8000 }).toBe(2);
  expect(chatBodies[1].history.at(-1)).toMatchObject({ text: "Remembering all the service names", input: "voice" });

  // The choice is remembered for the next conversation.
  await page.reload();
  await startSkippingWarmup(page);
  await expect(page.getByRole("button", { name: "Hands-free" })).toBeVisible();
});

test("interview reports show answer structure, and progress shows readiness", async ({ page }) => {
  await page.addInitScript(() => {
    const report = {
      corrections: [],
      other_errors: [],
      correct_uses: [],
      phrases: [],
      task: { completed: true, met: ["States a clear result or lesson"], feedback_en: "Clear story." },
      praise_en: "",
      interview: {
        answers: [
          {
            question: "Tell me about a challenge you handled.",
            direct: true,
            example: true,
            actions: true,
            result: false,
            tip_en: "End with what changed, ideally a number.",
            better_start: "Last year, our main server went down two days before a launch.",
          },
        ],
        readiness: 3,
        note_en: "Close your stories with the outcome.",
      },
    };
    const day = new Date().toISOString().slice(0, 10);
    const state = {
      v: 1,
      errors: {},
      phrases: [],
      spend: {},
      sessions: [
        {
          id: "iv1",
          scenarioId: "interview-star",
          mode: "quiet",
          startedAt: new Date().toISOString(),
          endedAt: new Date().toISOString(),
          day,
          turns: [{ role: "learner", text: "We had a big problem with the server.", input: "text" }],
          speakingSeconds: 120,
          stuckCount: 0,
          fixedAloud: [],
          xp: 20,
          costUsd: 0,
          report,
        },
      ],
    };
    if (!localStorage.getItem("sw_learner_v1")) localStorage.setItem("sw_learner_v1", JSON.stringify(state));
  });

  await page.goto("/report/iv1");
  const card = page.getByRole("region", { name: "Your interview answers" });
  await expect(card).toContainText("3/5");
  await expect(card.getByText("Missing: ")).toHaveCount(1);
  await expect(card).toContainText("Result or lesson");
  await expect(card).toContainText("Strong start: Last year, our main server went down");
  await card.getByRole("button", { name: "What do these four mean?" }).click();
  await expect(card).toContainText("They are hiring you, not your team.");
  await card.getByRole("button", { name: "Translate" }).click();
  await expect(card.getByText(/מגייסים אותך/)).toBeVisible();
  await card.getByRole("button", { name: "Save the strong start to practice" }).click();
  await expect(card.getByLabel("Saved to your phrase bank")).toBeVisible();
  await expect(page.getByText("States a clear result or lesson")).toBeVisible();

  await page.goto("/progress");
  const ready = page.getByRole("region", { name: "Interview readiness" });
  await expect(ready).toContainText("1 of 6 interview scenarios practiced");
  await expect(ready).toContainText("3/5");
  // One answer isn't enough to call a pattern yet.
  await expect(ready).toContainText("Each interview report checks four things");
});

test("quick review: two minutes on due items without a conversation", async ({ page }) => {
  await mockApis(page, []);
  await page.goto("/review");
  await expect(page.getByText("Nothing is due right now.")).toBeVisible();

  // One real conversation makes the placement mistakes reviewable.
  await page.goto("/session/work-standup");
  await page.getByRole("button", { name: /Quiet mode/ }).click();
  await page.getByRole("button", { name: "Start conversation" }).click();
  await page.getByLabel("Your reply").fill("Yesterday I finished the report");
  await page.getByLabel("Your reply").press("Enter");
  await expect(page.getByText("What's the hardest part so far?")).toBeVisible();
  await page.getByRole("button", { name: "End conversation" }).click();
  await expect(page).toHaveURL(/\/report\//);

  await page.goto("/practice");
  await page.getByRole("link", { name: /Quick review/ }).click();
  await page.getByRole("button", { name: /Type it/ }).click();
  await page.getByRole("button", { name: /Review \d items/ }).click();
  await expect(page.getByText("Earlier you said:")).toBeVisible();
  await page.getByLabel("Your answer").fill("I have been living in Shoham for ten years");
  await page.getByRole("button", { name: "Check" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Correct" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Next" })).toBeInViewport();
  await page.getByRole("button", { name: "Skip" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Done." })).toBeVisible();
});

test("demo mode: a full conversation and sample report with no keys at all", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /Try a demo conversation/ }).click();
  await expect(page.getByRole("heading", { name: "Your week" })).toBeVisible();
  await page.getByRole("button", { name: /Quiet mode/ }).click();
  await page.getByRole("button", { name: "Start conversation" }).click();
  await expect(page.getByText("Demo", { exact: true })).toBeVisible();

  const box = page.getByLabel("Your reply");
  await box.fill("I study for AZ-900 two weeks");
  await box.press("Enter");
  await expect(page.getByText("How long have you been doing that?")).toBeVisible();
  await box.fill("Two weeks, it's hard but fun");
  await box.press("Enter");
  await expect(page.getByText("What's the hardest part so far?")).toBeVisible();

  await page.getByRole("button", { name: "End conversation" }).click();
  await expect(page).toHaveURL(/\/report\//);
  await expect(page.getByRole("note")).toContainText("Sample report from the demo");
  await expect(page.getByText("I've been living in Shoham for ten years.")).toBeVisible();
  await expect(page.getByLabel(/XP earned/)).toHaveCount(0);

  // It doesn't count: progress still shows no conversations.
  await page.goto("/progress");
  await expect(page.getByRole("heading", { name: "Recent conversations" })).toHaveCount(0);
});
