import type {Config} from "jest";
import presets from "jest-preset-angular/presets/index.js";

const esmPreset = presets.createEsmPreset();

/**
 * Jest test configuration.
 *
 * We set up the `fake-indexeddb` script to allow testing against an indexed db.
 * Also we invoke our own test environment to provide relevant globals to our
 * tests.
 */
const config: Config = {
  ...esmPreset,
  // prefer published JavaScript over any TypeScript sources shipped alongside it
  moduleFileExtensions: ["js", "mjs", "ts", "html", "json"],
  globalSetup: "<rootDir>/scripts/jest/global-setup.cjs",
  setupFiles: ["fake-indexeddb/auto"],
  setupFilesAfterEnv: ["<rootDir>/src/tests/initialize.ts"],
  testEnvironment: "./src/tests/environment.ts",
  transform: {
    ...esmPreset.transform,
    "\\.txt$": "<rootDir>/src/tests/txt-transformer.ts",
  },
};

export default config;
