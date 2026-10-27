import { expect, test } from "@playwright/test";

test("offline: pages opened before still load, conversations show the offline page", async ({ page, context }) => {
  await page.goto("/");
  // Wait until the service worker controls the page, then visit what should be kept.
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise((r) => navigator.serviceWorker.addEventListener("controllerchange", r, { once: true }));
    }
  });
  for (const path of ["/phrases", "/review", "/progress"]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }

  await context.setOffline(true);
  await page.goto("/phrases");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Phrase");
  await page.goto("/review");
  await expect(page.getByRole("heading", { name: "Quick review" })).toBeVisible();

  await page.goto("/session/free-your-week");
  await expect(page.getByRole("heading", { name: "You're offline" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Quick review" })).toBeVisible();
  await context.setOffline(false);
});
