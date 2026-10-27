import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const PAGES = [
  "/",
  "/practice",
  "/words",
  "/listen",
  "/read/r-habits",
  "/say/a-and-the",
  "/mistakes/present_perfect_duration",
  "/progress",
];

for (const theme of ["dark", "light"] as const) {
  test(`readable and labeled in ${theme} mode (axe, WCAG A/AA)`, async ({ page }) => {
    test.setTimeout(60_000);
    await page.addInitScript((t) => localStorage.setItem("sw_prefs_v1", JSON.stringify({ theme: t })), theme);
    for (const path of PAGES) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
      const summary = violations.map((v) => `${path}: ${v.id} (${v.nodes.length}) ${v.nodes[0]?.target.join(" ")}`);
      expect(summary, summary.join("\n")).toEqual([]);
    }
  });
}
