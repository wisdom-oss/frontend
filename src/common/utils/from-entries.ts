/**
 * Typed wrapper around Object.fromEntries that keeps literal key types.
 *
 * @example
 * ```ts
 * const entries = [
 *   ["name", "Alice"] as const,
 *   ["age", 30] as const,
 * ] as const;
 *
 * const user = fromEntries(entries);
 * // user: { name: "Alice"; age: number }
 * ```
 */
export function fromEntries<E extends [PropertyKey, any][]>(
  entries: E,
): {[K in E[number] as K[0]]: K[1]} {
  return Object.fromEntries(entries) as {[K in E[number] as K[0]]: K[1]};
}
