import { expect, test } from "@playwright/test";

test("word cards: add a pack, recall from the meaning, rate, finish", async ({ page }) => {
  await page.route("**/api/tts", (route) =>
    route.fulfill({ status: 503, contentType: "application/json", body: '{"error":"not_configured"}' }),
  );
  await page.goto("/practice");
  await page.getByRole("link", { name: /Word cards/ }).click();
  await expect(page.getByRole("heading", { name: "Word cards" })).toBeVisible();
  await expect(page.getByText("0 to review · 0 new")).toBeVisible();
  // Nothing added yet: it points to the packs instead of saying "all done".
  await expect(page.getByRole("button", { name: "Add a pack below to start" })).toBeDisabled();

  // Preview a pack, then add it.
  await page.getByRole("button", { name: /^Office and meetings B1\+/ }).click();
  await expect(page.getByText("touch base", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Add Office and meetings" }).click();
  await expect(page.getByText("0 to review · 10 new")).toBeVisible();
  await expect(page.getByRole("button", { name: "Study Office and meetings" })).toBeVisible();

  await page.getByRole("button", { name: "Study now" }).click();
  // Front: the meaning and the example with a gap, the word hidden.
  await expect(page.getByText("What's the word?")).toBeVisible();
  await expect(page.getByText("contact someone again about something")).toBeVisible();
  await expect(page.getByText("I'll _____ with him after lunch.")).toBeVisible();
  await page.getByRole("button", { name: "Show" }).click();
  await expect(page.getByText("follow up", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Good" }).click();
  // Next card; "Again" puts it back later in the round.
  await expect(page.getByText("agreeing and understanding the same thing")).toBeVisible();
  await page.getByRole("button", { name: "Show" }).click();
  await page.getByRole("button", { name: "Again" }).click();
  await page.getByRole("button", { name: "Finish" }).click();

  await expect(page.getByRole("status").filter({ hasText: "2 cards done" })).toBeVisible();
  // Both were started today (Good: back in 3 days, Again: tomorrow), so 8 new words are left today.
  await expect(page.getByText("0 to review · 8 new")).toBeVisible();
});
