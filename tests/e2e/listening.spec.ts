import { expect, test } from "@playwright/test";

function silentWav(): Buffer {
  const n = 800;
  const b = Buffer.alloc(44 + n);
  b.write("RIFF", 0);
  b.writeUInt32LE(36 + n, 4);
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
  b.writeUInt32LE(n, 40);
  b.fill(128, 44);
  return b;
}

test("dictation round: type what you hear, see the diff, finish with a score", async ({ page }) => {
  const spoken: string[] = [];
  await page.route("**/api/tts", async (route) => {
    spoken.push((route.request().postDataJSON() as { text: string }).text);
    await route.fulfill({ status: 200, contentType: "audio/wav", body: silentWav() });
  });
  await page.goto("/practice");
  await page
    .getByRole("link", { name: /Listening gym/ })
    .first()
    .click();
  await expect(page.getByText("Your listening speed")).toBeVisible();
  // Screens reached from Practice keep the Practice tab lit.
  await expect(page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Practice" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await page.getByRole("button", { name: "British", exact: true }).click();
  await page.getByRole("button", { name: /Start 8 sentences/ }).click();
  await expect(page.getByText(/· British ·/)).toBeVisible();

  for (let i = 0; i < 8; i++) {
    await expect.poll(() => spoken.length).toBeGreaterThan(i);
    const sentence = spoken[spoken.length - 1];
    await page.getByLabel("Type exactly what you heard").fill(i === 0 ? "something else entirely" : sentence);
    await page.getByRole("button", { name: "Check" }).click();
    await expect(page.getByText(i === 0 ? "Not quite" : "Got it!")).toBeVisible();
    await page.getByRole("button", { name: i === 7 ? "Finish" : "Next" }).click();
  }
  await expect(page.getByText("7 of 8 correct · +35 XP")).toBeVisible();
  // Speed adapts during the round: a miss (0.85×), then 3 right (0.90×), then 3 more (0.95×).
  await expect(page.getByText("Faster! You went from 0.90× to 0.95×.")).toBeVisible();
});

test("listening story: hear it with the words hidden, answer, then read it and save phrases", async ({ page }) => {
  const spoken: string[] = [];
  await page.route("**/api/tts", async (route) => {
    spoken.push((route.request().postDataJSON() as { text: string }).text);
    await route.fulfill({ status: 200, contentType: "audio/wav", body: silentWav() });
  });
  await page.goto("/listen");
  await page.getByRole("link", { name: /Monday morning/ }).click();
  await expect(page.getByRole("heading", { name: "Monday morning" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Listen first" })).toBeDisabled();
  // The words are hidden while listening.
  await expect(page.getByText("Rough weekend?")).toHaveCount(0);
  await page.getByRole("button", { name: "Play" }).click();
  await expect(page.getByRole("button", { name: "Play again" })).toBeVisible({ timeout: 15_000 });
  expect(spoken).toHaveLength(6);

  await page.getByRole("button", { name: "Answer the questions" }).click();
  await page.getByRole("button", { name: "A party next door kept him awake" }).click();
  await expect(page.getByText("“My neighbors had a party till three, so I barely slept.”")).toBeVisible();
  await page.getByRole("button", { name: "At ten" }).click(); // wrong on purpose
  await page.getByRole("button", { name: "Relieved" }).click();
  await page.getByRole("button", { name: /2\/3 right · Read the dialogue/ }).click();
  await expect(page.getByText("Morning! You look exhausted. Rough weekend?")).toBeVisible();
  await page.getByRole("button", { name: "Save to word cards" }).click();
  await expect(page.getByText("Saved to your word cards")).toBeVisible();

  await page.goto("/listen");
  await expect(page.getByRole("link", { name: /Monday morning/ })).toContainText("Best 2/3");
});

test("radio: a one-host talk opens in the story player", async ({ page }) => {
  await page.route("**/api/tts", (route) =>
    route.fulfill({ status: 200, contentType: "audio/wav", body: silentWav() }),
  );
  await page.goto("/listen");
  await page.getByRole("link", { name: /The two-minute rule for new habits/ }).click();
  await expect(page.getByText(/Radio · B1/)).toBeVisible();
  await page.getByRole("button", { name: "Play" }).click();
  await expect(page.getByRole("button", { name: "Play again" })).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: "Answer the questions" }).click();
  await expect(page.getByRole("group", { name: "What is the two-minute rule?" })).toBeVisible();
});

test("shadow a story line: hear it, say it, the mic checks the words", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "mediaDevices", {
      value: { getUserMedia: async () => ({ getTracks: () => [] }) },
    });
    class FakeRecognition {
      lang = "";
      continuous = false;
      interimResults = false;
      onresult: ((e: unknown) => void) | null = null;
      onerror: ((e: unknown) => void) | null = null;
      onend: (() => void) | null = null;
      onaudiostart: (() => void) | null = null;
      start() {
        (window as unknown as { __rec: FakeRecognition }).__rec = this;
      }
      stop() {
        setTimeout(() => this.onend?.(), 10);
      }
      abort() {}
    }
    Object.assign(window, { SpeechRecognition: FakeRecognition });
  });
  await page.route("**/api/tts", (route) =>
    route.fulfill({ status: 200, contentType: "audio/wav", body: silentWav() }),
  );
  await page.goto("/listen/story/s-monday");
  await page.getByRole("button", { name: "Play" }).click();
  await expect(page.getByRole("button", { name: "Play again" })).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: "Answer the questions" }).click();
  for (const a of ["A party next door kept him awake", "At two", "Relieved"])
    await page.getByRole("button", { name: a }).click();
  await page.getByRole("button", { name: /Read the dialogue/ }).click();

  const shadow = page.getByRole("region", { name: /Shadow it/ });
  await shadow.getByRole("button", { name: "Start shadowing" }).click();
  await expect(shadow).toContainText("Line 1 of 6");
  await shadow.getByRole("button", { name: "Say it" }).click();
  await page.waitForFunction(() => "__rec" in window);
  await page.evaluate(() => {
    const rec = (window as unknown as { __rec: { onaudiostart: () => void; onresult: (e: unknown) => void } }).__rec;
    rec.onaudiostart();
    rec.onresult({
      resultIndex: 0,
      results: [Object.assign([{ transcript: "Morning you look exhausted rough weekend" }], { isFinal: true })],
    });
  });
  await shadow.getByRole("button", { name: /Listening · tap when done/ }).click();
  await expect(shadow.getByRole("status")).toContainText("That's it.");
  await shadow.getByRole("button", { name: "Next" }).click();
  await expect(shadow).toContainText("Line 2 of 6");
});
