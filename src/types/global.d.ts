export {};

declare global {
  interface ObjectConstructor {
    /**
     * Run fn on each value in obj and get back a new object
     * with the same keys but new values.
     *
     * @param obj  the source object
     * @param fn   (value, key) => new value
     * @returns    a fresh object where each key maps to fn’s result
     *
     * @example
     * const nums = { a: 1, b: 2 }
     * const doubled = mapObj(nums, n => n * 2)
     * // doubled is { a: 2, b: 4 }
     */
    map<T extends Record<PropertyKey, any>, U>(
      obj: T,
      fn: (v: T[keyof T], k: keyof T) => U,
    ): {[K in keyof T]: U};
  }
}
