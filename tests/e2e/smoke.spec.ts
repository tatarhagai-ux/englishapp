import { expect, test } from "@playwright/test";

test.describe("app shell", () => {
  test("home shows the mission, boss mistake, stats and setup prompt", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Hagai");
    await expect(page.getByRole("heading", { name: "Tell me about yourself" })).toBeVisible();
    await expect(page.getByText("Say “I've been … for …” 3 times")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Boss mistake: Present perfect for “how long”" })).toBeVisible();
    await expect(page.getByText("Finish setup to start talking")).toBeVisible();
    await expect(page.getByRole("link", { name: /Start talking/ })).toHaveAttribute("href", "/setup");
    await expect(page.getByLabel("0 day streak")).toBeVisible();
  });

  test("progress lists every focus mistake and locked achievements", async ({ page }) => {
    await page.goto("/progress");
    await expect(page.getByRole("heading", { name: "Level 1" })).toBeVisible();
    await expect(page.getByText("new", { exact: true })).toHaveCount(8);
    await expect(page.getByText("Interview ready")).toBeVisible();
    await expect(page.getByText("First words")).toBeVisible();
  });

  test("settings save and survive a reload", async ({ page }) => {
    await page.goto("/settings");
    await expect(
      page.getByRole("group", { name: "Correction style" }).getByRole("button", { name: "Gentle" }),
    ).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("group", { name: "Correction style" }).getByRole("button", { name: "Precise" }).click();
    await page.getByRole("group", { name: "Daily goal" }).getByRole("button", { name: "15", exact: true }).click();
    await expect(page.getByText(/points out each important mistake/)).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole("group", { name: "Correction style" }).getByRole("button", { name: "Precise" }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(
      page.getByRole("group", { name: "Daily goal" }).getByRole("button", { name: "15", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByText("Monthly spending cap:")).toContainText("$15");
  });

  test("sync explains it needs setup when Supabase isn't connected", async ({ page }) => {
    await page.goto("/settings");
    const sync = page.getByRole("region", { name: "Sync across devices" });
    await expect(sync).toContainText("saved on this device only");
    await sync.getByRole("link", { name: "setup page" }).click();
    await expect(page).toHaveURL(/\/setup$/);
  });

  test("bottom navigation reaches every tab", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Main" });
    for (const [label, heading] of [
      ["Practice", "Practice"],
      ["Progress", "Progress"],
      ["Settings", "Settings"],
      ["Home", /Hagai/],
    ] as const) {
      await nav.getByRole("link", { name: label }).click();
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
      await expect(nav.getByRole("link", { name: label })).toHaveAttribute("aria-current", "page");
    }
  });

  test("no horizontal scrolling on any main screen", async ({ page }) => {
    for (const path of ["/", "/practice", "/progress", "/settings", "/settings/voice", "/setup"]) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `horizontal overflow on ${path}`).toBeLessThanOrEqual(0);
    }
  });
});

test.describe("voice picker", () => {
  test("lists tutor voices and filters by gender", async ({ page }) => {
    await page.goto("/settings/voice");
    await expect(page.getByRole("button", { name: /^Play / })).toHaveCount(8);
    await page.getByRole("button", { name: "Female", exact: true }).click();
    await expect(page.getByRole("button", { name: /^Play / })).toHaveCount(4);
    await page.getByRole("button", { name: "Male", exact: true }).click();
    await expect(page.getByRole("button", { name: "Play Andrew" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Play Ava" })).toHaveCount(0);
  });

  test("choosing a voice persists across reloads and shows on home", async ({ page }) => {
    await page.goto("/settings/voice");
    const ryan = page.getByRole("listitem").filter({ hasText: "Ryan" });
    await ryan.getByRole("button", { name: "Choose" }).click();
    await expect(ryan.getByRole("button", { name: "Your tutor" })).toHaveAttribute("aria-pressed", "true");
    await page.reload();
    await expect(
      page.getByRole("listitem").filter({ hasText: "Ryan" }).getByRole("button", { name: "Your tutor" }),
    ).toBeVisible();
    await page.goto("/");
    await expect(page.getByText("Ryan", { exact: true })).toBeVisible();
    await expect(page.getByText("Your tutor", { exact: true })).toBeVisible();
  });

  test("without Azure, samples play with the browser's own voice", async ({ page }) => {
    await page.goto("/settings/voice");
    await page.getByRole("button", { name: "Play Ava" }).click();
    await expect(page.getByRole("status").filter({ hasText: "browser's closest voice" })).toBeVisible();
    await expect(page.getByRole("alert").filter({ hasText: "Azure" })).toHaveCount(0);
  });
});

test.describe("setup and APIs", () => {
  test("setup page reports nothing connected yet", async ({ page }) => {
    await page.goto("/setup");
    await expect(page.getByText(/0 of 4 connected/)).toBeVisible();
    await expect(page.getByLabel("Not connected")).toHaveCount(4);
  });

  test("health reports booleans only", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.ok()).toBe(true);
    expect(await res.json()).toEqual({
      ok: true,
      services: { accessGate: false, azure: false, llm: false, supabase: false },
    });
  });

  test("tts validates input and reports missing config", async ({ request }) => {
    const bad = await request.post("/api/tts", { data: { text: "", voiceId: "ava" } });
    expect(bad.status()).toBe(400);
    const unknown = await request.post("/api/tts", { data: { text: "Hi", voiceId: "nope" } });
    expect(unknown.status()).toBe(400);
    const res = await request.post("/api/tts", { data: { text: "Hello there", voiceId: "ava" } });
    expect(res.status()).toBe(503);
    expect(await res.json()).toMatchObject({ error: "not_configured", service: "Azure Speech" });
  });

  test("pwa manifest and icons are served", async ({ request }) => {
    const manifest = await request.get("/manifest.webmanifest");
    expect(manifest.ok()).toBe(true);
    const json = await manifest.json();
    expect(json.display).toBe("standalone");
    for (const icon of json.icons as { src: string }[]) {
      expect((await request.get(icon.src)).ok(), icon.src).toBe(true);
    }
  });
});

test("data can be exported and deleted from settings", async ({ page }) => {
  await page.goto("/settings");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export backup" }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/^speakwise-backup-\d{4}-\d{2}-\d{2}\.json$/);

  await page.getByRole("button", { name: "Delete all" }).click();
  await expect(page.getByRole("alertdialog")).toContainText("can't be undone");
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Delete all" }).click();
  await page.getByRole("button", { name: "Yes, delete" }).click();
  await expect(page.getByRole("status").filter({ hasText: "deleted" })).toBeVisible();
});

test("phrase bank imports a list with meanings and Hebrew", async ({ page }) => {
  await page.route("**/api/assist", async (route) => {
    const body = route.request().postDataJSON() as { mode: string; items: string[] };
    expect(body.mode).toBe("define");
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        items: body.items.map((t) => ({
          text: t,
          meaning_en: `meaning of ${t}`,
          meaning_he: `תרגום ${t}`,
          example: `I use ${t}.`,
        })),
        model: "m",
        usage: null,
      }),
    });
  });
  await page.goto("/progress");
  await page.getByRole("link", { name: /Phrases saved/ }).click();
  await expect(page.getByRole("heading", { name: "Phrase bank" })).toBeVisible();
  await page.getByRole("button", { name: "Import a list" }).click();
  await page.getByLabel("Paste words or phrases, one per line").fill("1. tactical empathy\n2. calibrated question");
  await page.getByLabel("Where are they from? (optional)").fill("Never Split the Difference");
  await expect(page.getByText("2 items detected")).toBeVisible();
  await page.getByRole("button", { name: "Add 2" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Added 2 new phrases" })).toBeVisible();
  await expect(page.getByText("meaning of tactical empathy")).toBeVisible();
  await page.getByRole("button", { name: "Translate" }).first().click();
  await expect(page.getByText(/תרגום/).first()).toBeVisible();
  await page.getByRole("button", { name: "Delete calibrated question" }).click();
  await expect(page.getByText("meaning of calibrated question")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Never Split the Difference" })).toBeVisible();
});

test("pronunciation course: open a unit, hear a minimal pair, read the Hebrew tip", async ({ page }) => {
  const spoken: string[] = [];
  await page.route("**/api/tts", async (route) => {
    spoken.push((route.request().postDataJSON() as { text: string }).text);
    await route.fulfill({ status: 503, contentType: "application/json", body: '{"error":"not_configured"}' });
  });
  await page.goto("/practice");
  await page.getByRole("link", { name: /Pronunciation for Hebrew speakers/ }).click();
  await expect(page.getByText("0 / 10")).toBeVisible();
  await page.getByRole("link", { name: /W is not V/ }).click();
  await expect(page.getByRole("heading", { name: "W is not V" })).toBeVisible();
  await page.getByRole("button", { name: "west" }).click();
  await expect.poll(() => spoken).toContain("west");
  await page.getByRole("button", { name: "Translate" }).click();
  await expect(page.getByText(/דוברי עברית הופכים/)).toBeVisible();
  await expect(page.getByRole("link", { name: /Next: Short i vs long ee/ })).toBeVisible();
});

test("guide explains the method and links to pronunciation practice", async ({ page }) => {
  await page.goto("/settings");
  await page.getByRole("link", { name: /How Speakwise works/ }).click();
  await expect(page.getByRole("heading", { name: "The method" })).toBeVisible();
  await expect(page.getByText("I've been living here for ten years.")).toBeVisible();
  await page.getByRole("button", { name: "Why (in Hebrew)" }).first().click();
  await expect(page.getByText(/בעברית יש הווה אחד/)).toBeVisible();
  await page.getByRole("link", { name: "Practice it" }).first().click();
  await expect(page).toHaveURL(/\/pronounce\//);
});

test("daily reminder: download a calendar event or open Google Calendar", async ({ page }) => {
  await page.goto("/settings");
  const section = page.getByRole("region", { name: "Daily reminder" });
  await section.getByLabel("Time").fill("13:15");
  const download = page.waitForEvent("download");
  await section.getByRole("button", { name: "Other calendar" }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe("speakwise-daily-reminder.ics");
  const ics = await (await file.createReadStream()).toArray();
  expect(Buffer.concat(ics).toString()).toContain("RRULE:FREQ=DAILY");
  await expect(section.getByRole("status")).toContainText("every day at 13:15");

  await page.context().route("https://calendar.google.com/**", (r) => r.fulfill({ status: 200, body: "ok" }));
  const popup = page.waitForEvent("popup");
  await section.getByRole("button", { name: "Google Calendar" }).click();
  expect((await popup).url()).toContain("calendar.google.com");
});
