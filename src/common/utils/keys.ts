/**
 * Returns the keys of a record as a typed array.
 *
 * This is useful for writing `for...of` loops with known key types.
 *
 * @example
 * ```ts
 * const user = { name: "Alice", age: 30 };
 * for (const key of keys(user)) {
 *   console.log(key); // key is typed as "name" | "age"
 * }
 * ```
 */
export function keys<T extends Record<any, any>>(record: T): Array<keyof T> {
  return Object.keys(record);
}
