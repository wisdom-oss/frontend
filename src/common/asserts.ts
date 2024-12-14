/** Error when an assertion in this namespace failed. */
class AssertError extends Error {
  constructor(
    readonly expected: string,
    readonly got: any,
  ) {
    super(`assertion failed: expected ${expected}, got ${got}`);
    this.name = AssertError.name;
  }
}

/**
 * Assert functions to assert common values.
 *
 * Use this namespace instead of `as T` wherever possible to avoid nasty errors
 * because you only assumed a type to be `T`.
 * These functions will throw on invalid types making sure your code
 * shortcircuits instead of running with upcoming type errors.
 *
 * Add more functions here as you see fit.
 */
export namespace asserts {
  /**
   * Inverted namespace to check that type is not something.
   *
   * The implementation here may be specific but can also be just a negation of
   * the outer function.
   */
  export namespace not {
    /**
     * Assert that a type is not a string.
     * @param value Value to type check.
     */
    export function string<T>(value: T): asserts value is Exclude<T, string> {
      if (typeof value === "string") throw new AssertError("string", value);
    }
  }

  export const Error = AssertError;
}
