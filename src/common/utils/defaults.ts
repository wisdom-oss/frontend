export function defaults<K extends string | number | symbol, V>(
  initial: Record<K, Partial<V>>,
): Record<K, Partial<V>>;
export function defaults<K extends string | number | symbol, V>(
  initial: Record<K, V>,
  defaultGenerator: (key: K) => V,
): Record<K, V>;

/**
 * Wraps a record so that any missing key will automatically get a default value.
 *
 * If a `defaultGenerator` is provided, it's called with the missing key to 
 * create the value. 
 * If no generator is given, missing keys will default to an empty object (`{}`).
 * This avoids having to check for key presence before using the value.
 *
 * @param initial The base record to extend. This object will be modified directly.
 * @param defaultGenerator Optional function that receives the missing key and returns a default value.
 *
 * @example
 * ```ts
 * const map = defaults({} as Record<string, string[]>, (key) => [key]);
 * map["a"].push("hello"); // "a" is set to ["a"] automatically
 * ```
 *
 * @remarks
 * The `initial` object is not cloned. 
 * Any changes to the returned record will directly affect the original one.
 */
export function defaults<K extends string | number | symbol, V>(
  initial: Record<K, V>,
  defaultGenerator?: (key: K) => V,
): Record<K, V> {
  let gen = defaultGenerator ?? (() => ({}));
  return new Proxy(initial, {
    get(_target, prop, _receiver) {
      if (!(prop in initial)) initial[prop as K] = gen(prop as K) as V;
      return initial[prop as K];
    }
  });
}
