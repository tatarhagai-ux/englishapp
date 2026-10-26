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
  await expect(page.getByLabel(/XP earned/)).toContainText("+");
  await expect(page.getByText("“I'm stuck” used")).toBeVisible();

  await page.getByRole("link", { name: "Continue" }).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("link", { name: /Last report/ })).toBeVisible();

  await page.goto("/progress");
  await expect(page.getByRole("heading", { name: "Recent conversations" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Your week/ })).toBeVisible();
  await expect(page.getByText("Phrases saved").locator("..")).toContainText("1");
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
  await expect(page.getByText("Natasha · Australian accent")).toBeVisible();
});

test("warm-up: recall the correct sentence by typing, then the conversation starts", async ({ page }) => {
  await mockApis(page, []);
  await page.goto("/session/free-your-week");
  await page.getByRole("button", { name: /Quiet mode/ }).click();
  await page.getByRole("button", { name: /Warm up \(2\) & start/ }).click();

  await expect(page.getByText("Last time you said:")).toBeVisible();
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
  await page.getByRole("button", { name: "Start the conversation" }).click();

  await expect(page.getByText("Hey! So, what have you been up to this week?")).toBeVisible();

  // Those two are scheduled for later; the next visit warms up on the next two mistakes.
  await page.goto("/session/interview-about-you");
  await page.getByRole("button", { name: /Quiet mode/ }).click();
  await page.getByRole("button", { name: /Warm up \(2\)/ }).click();
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
