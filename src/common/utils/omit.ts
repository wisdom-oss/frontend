/**
 * Returns a new object without the given keys.
 *
 * Useful for removing fields while keeping types accurate.
 *
 * @example
 * ```ts
 * const user = { name: "Alice", age: 30, admin: true } as const;
 * const publicUser = omit(user, "admin");
 * // publicUser: { name: "Alice"; age: 30 }
 * ```
 *
 * @example
 * ```ts
 * type User = { id: string; email: string; password: string };
 * const u: User = { id: "1", email: "a@example.com", password: "secret" };
 * const safe = omit(u, "password");
 * // safe: { id: string; email: string }
 * ```
 */
export function omit<R extends Record<PropertyKey, any>, K extends PropertyKey>(
  record: R,
  ...omit: K[]
): Omit<R, K> {
  return Object.fromEntries(
    Object.entries(record).filter(([key, _]) => !omit.includes(key as K)),
  ) as Omit<R, K>;
}
