import type {Dayjs} from "dayjs";

import "expect";

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeSameDate(expected: Dayjs): R;
    }
  }
}

declare module "expect" {
  interface Matchers<R extends void | Promise<void>, T = unknown> {
    toBeSameDate(expected: Dayjs): R;
  }
}
