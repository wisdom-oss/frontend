import type {Config} from "jest";

/**
 * Jest test configuration.
 *
 * We set up the `fake-indexeddb` script to allow testing against an indexed db.
 * Also we invoke our own test environment to provide relevant globals to our
 * tests.
 */
const config: Config = {
  globalSetup: "<rootDir>/scripts/jest/global-setup.cjs",
  setupFiles: ["fake-indexeddb/auto", "<rootDir>/src/tests/setup.ts"],
  testEnvironment: "./src/tests/setup.ts",
  transform: {
    "\\.txt$": "<rootDir>/src/tests/txt-transformer.ts",
  },
};

export default config;
