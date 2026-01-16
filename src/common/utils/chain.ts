/**
 * Yields all values from the given iterables in order.
 *
 * This is a simple way to loop through multiple sources as one stream without
 * creating intermediate arrays.
 *
 * @example
 * const a = [1, 2];
 * const b = [3];
 *
 * for (const x of chain(a, b)) {
 *   console.log(x);
 * }
 * // 1, 2, 3
 */
export function* chain<T>(...iters: Iterable<T>[]) {
  for (let it of iters) {
    yield* it;
  }
}
