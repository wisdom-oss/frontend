import {expect} from "@jest/globals";

import dayjs, {Dayjs} from "dayjs";
import type {MatcherFunction} from "expect";

const toBeSameDate: MatcherFunction<[expected: Dayjs]> = function (
  received,
  expected,
) {
  if (!dayjs.isDayjs(received) || !dayjs.isDayjs(expected)) {
    throw new TypeError("toBeSameDate expects two Day.js objects");
  }

  return {
    pass: received.isSame(expected),
    message: () =>
      `${this.utils.matcherHint("toBeSameDate", undefined, undefined, {
        isNot: this.isNot,
        promise: this.promise,
      })}\n\nExpected: ${this.isNot ? "not " : ""}${this.utils.printExpected(expected.toJSON())}\nReceived: ${this.utils.printReceived(received.toJSON())}`,
  };
};

expect.extend({toBeSameDate});
