import { expect, test } from "@playwright/test";

test("short read: tap a phrase for help, save it, answer the questions", async ({ page }) => {
  await page.route("**/api/tts", (route) =>
    route.fulfill({ status: 503, contentType: "application/json", body: '{"error":"not_configured"}' }),
  );
  await page.goto("/practice");
  await page.getByRole("link", { name: /Short reads/ }).click();
  await expect(page.getByRole("link", { name: /Why small habits beat big plans/ })).toContainText("Next");
  await page.getByRole("link", { name: /Why small habits beat big plans/ }).click();
  await expect(page.getByRole("heading", { name: "Why small habits beat big plans" })).toBeVisible();

  await page.getByRole("button", { name: "adds up" }).click();
  const sheet = page.getByRole("dialog", { name: "adds up" });
  await expect(sheet).toContainText("grows into a large amount over time");
  await expect(sheet).toContainText("מצטבר");
  await sheet.getByRole("button", { name: "Save to word cards" }).click();
  await expect(sheet.getByRole("button", { name: "In your word cards" })).toBeDisabled();
  await sheet.getByRole("button", { name: "Close" }).click();

  await page.getByRole("button", { name: "They depend on how you feel" }).click();
  await page.getByRole("button", { name: "Connect a new habit to something you already do" }).click();
  await expect(page.getByRole("status").filter({ hasText: "2/2 right" })).toBeVisible();

  await page.goto("/phrases");
  await expect(page.getByText("adds up", { exact: true })).toBeVisible();
  await page.goto("/read");
  await expect(page.getByRole("link", { name: /Why small habits beat big plans/ })).toContainText("2/2");
  await expect(page.getByRole("link", { name: /Index funds in plain English/ })).toContainText("Next");
});
