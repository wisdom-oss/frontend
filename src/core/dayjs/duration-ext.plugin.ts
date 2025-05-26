import {PluginFunc} from "dayjs";
import {Duration} from "dayjs/plugin/duration";

declare module "dayjs/plugin/duration" {
  interface Duration {
    /**
     * Formats a duration into a short string like "3 min 4 s".
     *
     * Only includes non-zero parts. If a unit has a value > 1,
     * its number is shown too (e.g. "3 min"), otherwise only the unit (e.g. "s").
     * The order goes from largest to smallest: years to milliseconds.
     *
     * Returns "-" if the duration is exactly 0.
     *
     * Example:
     * ```ts
     * dayjs.duration({ minutes: 3, seconds: 4 }).formatUnit(); // "3 min 4 s"
     * ```
     */
    formatUnit(): string;

    /**
     * Loosens the precision of a duration to better match human expectations.
     *
     * For example, 12 months will be turned into 1 year, even though this might
     * slightly change the exact duration in milliseconds (since months and years
     * have variable lengths).
     *
     * Useful when displaying or comparing durations in a way that feels more
     * intuitive to people, rather than being mathematically strict.
     *
     * This is **not** a lossless transformation — the resulting duration may differ
     * slightly from the original one.
     *
     * Example:
     * ```ts
     * dayjs.duration({ months: 12 }).fuzzy().formatUnit(); // "a"
     * ```
     */
    fuzzy(): Duration;
  }
}

const durationExt: PluginFunc = (option, Dayjs, dayjs) => {
  let duration = dayjs.duration(0);
  let Duration = Object.getPrototypeOf(duration);

  // ATTENTION: this uses internal API and might break in the future,
  // but otherwise we are less useful.
  function inner(
    duration: Duration,
  ): Record<
      | "years"
      | "months"
      | "weeks"
      | "days"
      | "hours"
      | "minutes"
      | "seconds"
      | "milliseconds"
    ,
    undefined | number
  > {
    return (duration as any).$d;
  }

  Duration.formatUnit = function (this: Duration): string {
    if (this.asMilliseconds() == 0) return "-";

    let {
      years: a,
      months: mo,
      weeks: w,
      days: d,
      hours: h,
      minutes: min,
      seconds: s,
      milliseconds: ms,
    } = inner(this);

    let units: (string | number)[] = [];
    if (a && a > 1) units.push(a);
    if (a) units.push("a");
    if (mo && mo > 1) units.push(mo);
    if (mo) units.push("mo");
    if (w && w > 1) units.push(w);
    if (w) units.push("w");
    if (d && d > 1) units.push(d);
    if (d) units.push("d");
    if (h && h > 1) units.push(h);
    if (h) units.push("h");
    if (min && min > 1) units.push(min);
    if (min) units.push("min");
    if (s && s > 1) units.push(s);
    if (s) units.push("s");
    if (ms && ms > 1) units.push(ms);
    if (ms) units.push("ms");
    return units.join(" ");
  };

  Duration.fuzzy = function (this: Duration): Duration {
    let {years, months, weeks, days, hours, minutes, seconds, milliseconds} =
      inner(this);

    while (months && months >= 12) {
      months -= 12;
      years = (years ?? 0) + 1;
    }

    return dayjs.duration({
      years,
      months,
      weeks,
      days,
      hours,
      minutes,
      seconds,
      milliseconds,
    });
  };
};

export default durationExt;
