import { expect, test } from "@playwright/test";

test("say it in English: a missing word is named, a missed sentence comes back, the best is kept", async ({ page }) => {
  await page.route("**/api/tts", (route) =>
    route.fulfill({ status: 503, contentType: "application/json", body: '{"error":"not_configured"}' }),
  );
  await page.goto("/practice");
  await page.getByRole("link", { name: /Say it in English/ }).click();
  await page
    .getByRole("link")
    .filter({ has: page.getByText("A and the", { exact: true }) })
    .click();
  await expect(page.getByRole("heading", { name: "A and the" })).toBeVisible();
  await expect(page.getByText(/The rule: a \/ the/)).toBeVisible();
  await expect(page.getByText("קניתי טלפון חדש.")).toBeVisible();

  await page.getByRole("button", { name: "Type" }).click();
  const input = page.getByLabel("Your English sentence");
  await input.fill("I bought new phone");
  await page.getByRole("button", { name: "Check" }).click();
  await expect(page.getByRole("status")).toContainText("Missing: “a”.");
  await expect(page.getByText("I bought a new phone.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /Try again/ }).click();
  await page.getByLabel("Your English sentence").fill("I bought a new phone");
  await page.getByRole("button", { name: "Check" }).click();
  await expect(page.getByRole("status")).toContainText("That's it.");

  const answers = [
    "Life is hard sometimes",
    "He's an engineer",
    "Money isn't everything",
    "Did you close the door?",
    "I have a meeting tomorrow morning",
  ];
  for (const a of answers) {
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByLabel("Your English sentence").fill(a);
    await page.getByRole("button", { name: "Check" }).click();
    await expect(page.getByRole("status")).toContainText("That's it.");
  }
  // The first one was missed, so it comes back once more.
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByText("Once more")).toBeVisible();
  await page.getByRole("button", { name: /Show the answer/ }).click();
  await page.getByRole("button", { name: "Finish" }).click();
  await expect(page.getByText("5/6", { exact: true })).toBeVisible();

  await page.goto("/say");
  await expect(page.getByRole("link").filter({ has: page.getByText("A and the", { exact: true }) })).toContainText(
    "5/6",
  );

  // The missed one waits in "Your misses" until it's said right.
  await page.getByRole("link", { name: /Your misses/ }).click();
  await expect(page.getByText("קניתי טלפון חדש.")).toBeVisible();
  await page.getByRole("button", { name: "Type" }).click();
  await page.getByLabel("Your English sentence").fill("I bought a new phone");
  await page.getByRole("button", { name: "Check" }).click();
  await page.getByRole("button", { name: "Finish" }).click();
  await expect(page.getByText("All cleared from your misses.")).toBeVisible();
  await page.goto("/say");
  await expect(page.getByRole("link").filter({ has: page.getByText("A and the", { exact: true }) })).toBeVisible();
  await expect(page.getByRole("link", { name: /Your misses/ })).toHaveCount(0);
});
