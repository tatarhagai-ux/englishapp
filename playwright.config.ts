import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3100);

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    // Audio may play without a tap, so the fake microphones in the speech tests can run.
    launchOptions: { args: ["--autoplay-policy=no-user-gesture-required"] },
  },
  projects: [
    { name: "mobile", use: { ...devices["Pixel 7"] } },
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    // Production build with no provider keys: exercises the "not configured" paths.
    command: `npm run build && npx next start -p ${PORT}`,
    port: PORT,
    timeout: 180_000,
    reuseExistingServer: !process.env.CI,
    // A fixed build id, so the update check has something to compare.
    env: { APP_ACCESS_CODE: "", APP_SESSION_SECRET: "", VERCEL_GIT_COMMIT_SHA: "e2ebuild0000" },
  },
});
