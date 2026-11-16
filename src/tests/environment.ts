import {JestEnvironmentConfig, EnvironmentContext} from "@jest/environment";
import {TestEnvironment as JSDOMEnvironment} from "jest-environment-jsdom";

export default class WisdomTestEnvironment extends JSDOMEnvironment {
  constructor(config: JestEnvironmentConfig, context: EnvironmentContext) {
    super(config, context);
    this.global.structuredClone = globalThis.structuredClone;
  }
}
