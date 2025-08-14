/**
 * @file
 * Runs before anything else in the app to define project-wide changes.
 *
 * This file is meant for global patches, polyfills, and other modifications
 * that need to be available from the very start of execution. 
 * It ensures that these changes are applied consistently across the entire app 
 * without having to import them in multiple places.
 */

Object.map = function <T extends Record<PropertyKey, any>, U>(
  obj: T,
  fn: (v: T[keyof T], k: keyof T) => U,
): {[K in keyof T]: U} {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key, fn(value, key)]),
  ) as {[K in keyof T]: U};
};
