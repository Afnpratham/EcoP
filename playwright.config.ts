import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  retries: 0,
  reporter: [
    ["list"],
    ["html", { open: "never" }],
    ["json", { outputFile: "artifacts/e2e-results.json" }],
  ],
  use: {
    baseURL: process.env.ECOP_TEST_URL || "http://localhost:3100",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
