import { expect, test } from "@playwright/test";

/**
 * A fake microphone: quiet, then a tone for about a second (the "speech"), then quiet again.
 * The recorder should notice the speech, stop after the pause, and send it to be written down.
 */
async function fakeMic(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = async () => {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const dest = ctx.createMediaStreamDestination();
      osc.frequency.value = 220;
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.setValueAtTime(0.6, ctx.currentTime + 0.7);
      gain.gain.setValueAtTime(0, ctx.currentTime + 1.8);
      osc.connect(gain).connect(dest);
      osc.start();
      return dest.stream;
    };
  });
}

test("accurate recognition: the answer is recorded, written down on the server, and checked", async ({ page }) => {
  await fakeMic(page);
  await page.addInitScript(() => localStorage.setItem("sw_prefs_v1", JSON.stringify({ accurateSpeech: true })));
  const sent: { format: string; size: number }[] = [];
  await page.route("**/api/transcribe", async (route) => {
    if (route.request().method() === "GET") return route.fulfill({ json: { available: true } });
    const body = route.request().postDataJSON() as { audio: string; format: string };
    sent.push({ format: body.format, size: body.audio.length });
    await route.fulfill({ json: { text: "I must go.", costUsd: 0.0002 } });
  });
  await page.goto("/say/no-to");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Say it" }).click();
  await expect(page.getByRole("status")).toContainText("That's it.", { timeout: 15_000 });
  expect(sent).toHaveLength(1);
  expect(["webm", "ogg", "m4a"]).toContain(sent[0].format);
  expect(sent[0].size).toBeGreaterThan(100);
});

test("settings: choose between accurate recognition and the phone's own", async ({ page }) => {
  let posted = 0;
  await page.route("**/api/transcribe", async (route) => {
    if (route.request().method() === "GET") return route.fulfill({ json: { available: true } });
    posted++;
    await route.fulfill({ json: { text: "x", costUsd: 0 } });
  });
  await page.goto("/settings");
  const choice = page.getByRole("group", { name: "Understanding your speech" });
  await expect(choice.getByRole("button", { name: "Phone's own" })).toHaveAttribute("aria-pressed", "true");
  await choice.getByRole("button", { name: "Accurate (AI)" }).click();
  await expect(page.getByText(/written down by an AI speech model/)).toBeVisible();
  expect(posted).toBe(0);
});
