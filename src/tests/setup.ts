import {JestEnvironmentConfig, EnvironmentContext} from "@jest/environment";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import JSDOMEnvironment, {TestEnvironment} from "jest-environment-jsdom";

dayjs.extend(duration);

export default class WisdomTestEnvironment extends JSDOMEnvironment {
  constructor(config: JestEnvironmentConfig, context: EnvironmentContext) {
    super(config, context);
    this.global.structuredClone = globalThis.structuredClone;
  }
}
