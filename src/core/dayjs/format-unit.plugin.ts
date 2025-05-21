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
  }
}

const formatUnit: PluginFunc = (option, Dayjs, dayjs) => {
  let duration = dayjs.duration(0);
  let Duration = Object.getPrototypeOf(duration);
  Duration.formatUnit = function (this: Duration) {
    if (this.asMilliseconds() == 0) return "-";

    // ATTENTION: this uses internal API and might break in the future,
    // but otherwise we are less useful.
    let {
      years: a,
      months: mo,
      weeks: w,
      days: d,
      hours: h,
      minutes: min,
      seconds: s,
      milliseconds: ms,
    } = (this as any).$d as Record<string, number>;

    let units: (string | number)[] = [];
    if (a > 1) units.push(a);
    if (a) units.push("a");
    if (mo > 1) units.push(mo);
    if (mo) units.push("mo");
    if (w > 1) units.push(w);
    if (w) units.push("w");
    if (d > 1) units.push(d);
    if (d) units.push("d");
    if (h > 1) units.push(h);
    if (h) units.push("h");
    if (min > 1) units.push(min);
    if (min) units.push("min");
    if (s > 1) units.push(s);
    if (s) units.push("s");
    if (ms > 1) units.push(ms);
    if (ms) units.push("ms");
    return units.join(" ");
  };
};

export default formatUnit;
