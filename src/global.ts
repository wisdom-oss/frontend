Object.map = function <T extends Record<PropertyKey, any>, U>(
  obj: T,
  fn: (v: T[keyof T], k: keyof T) => U,
): {[K in keyof T]: U} {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key, fn(value, key)]),
  ) as {[K in keyof T]: U};
};
