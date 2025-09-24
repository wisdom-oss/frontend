/**
 * @file
 * Runs before anything else in the app to define project-wide changes.
 *
 * This file is meant for global patches, polyfills, and other modifications
 * that need to be available from the very start of execution.
 * It ensures that these changes are applied consistently across the entire app
 * without having to import them in multiple places.
 */

import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import customParseFormat from "dayjs/plugin/customParseFormat";
import duration from "dayjs/plugin/duration";
import isoWeek from "dayjs/plugin/isoWeek";
import relativeTime from "dayjs/plugin/relativeTime";

import durationExt from "./core/dayjs/duration-ext.plugin";

Object.map = function <T extends Record<PropertyKey, any>, U>(
  obj: T,
  fn: (v: T[keyof T], k: keyof T) => U,
): {[K in keyof T]: U} {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key, fn(value, key)]),
  ) as {[K in keyof T]: U};
};

dayjs.extend(duration);
dayjs.extend(relativeTime);
dayjs.extend(customParseFormat);
dayjs.extend(advancedFormat);
dayjs.extend(isoWeek);
dayjs.extend(durationExt);
