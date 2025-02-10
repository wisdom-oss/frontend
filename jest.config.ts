import type {Config} from "jest";

const config: Config = {
  setupFiles: ["<rootDir>/src/tests/setup.ts"],
  testEnvironment: "jsdom",
};

export default config;
