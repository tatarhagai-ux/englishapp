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
