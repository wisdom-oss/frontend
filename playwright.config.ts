import {defineConfig, devices} from "@playwright/test";

export default defineConfig({
  // look for tests in the source directory
  testDir: "./src",
  // only run files ending in .e2e.ts
  testMatch: "*.e2e.ts",
  // allow tests within the same file to run in parallel
  fullyParallel: true,
  // fail on ci if a test is marked with test.only
  forbidOnly: !!process.env["CI"],
  // retry failed tests twice on ci and skip retries locally
  retries: process.env["CI"] ? 2 : 0,
  // use one worker on ci and the default worker count locally
  workers: process.env["CI"] ? 1 : undefined,
  // print a line for each test result
  reporter: "list",
  // share these browser settings across all projects
  use: {
    // resolve relative urls against the configured server or the local dev server
    baseURL: process.env["PLAYWRIGHT_TEST_BASE_URL"] ?? "http://localhost:4200",

    // record a trace on the first retry to help debug failed tests
    trace: "on-first-retry",
  },

  // configure assertion defaults
  expect: {
    // configure screenshot comparisons
    toHaveScreenshot: {
      // keep reference screenshots beside each test, grouped by platform and project
      pathTemplate:
        "{testDir}/{testFileDir}/e2e/screenshots/{platform}/{projectName}/{arg}{ext}",
    },
  },

  projects: [
    {
      name: "chromium",
      use: {...devices["Desktop Chrome"]},
    },

    {
      name: "firefox",
      use: {...devices["Desktop Firefox"]},
    },
  ],
});
