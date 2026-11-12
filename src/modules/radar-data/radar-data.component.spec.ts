import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";

import {RadarDataComponent} from "./radar-data.component";
import type {RadarDataService} from "./radar-data.service";

dayjs.extend(duration);

const CLASS_NAME = RadarDataComponent.name;
const METHOD_NAME =
  RadarDataComponent.prototype["findNearestTimelapseDate"].name;

describe.skip(`${CLASS_NAME}#${METHOD_NAME}`, () => {
  const find = RadarDataComponent.prototype["findNearestTimelapseDate"];
  const m: RadarDataService.Manifest = {
    start: dayjs("2026-01-01T00:00:00Z"),
    end: dayjs("2026-01-01T01:00:00Z"),
    stepSize: dayjs.duration(5, "minutes"),
  } satisfies Partial<RadarDataService.Manifest> as any;

  it("should correctly handle outside values", () => {
    expect(find(m, m.start.subtract(1, "millisecond"))).toBeNull();
    expect(find(m, m.end.add(1, "millisecond"))).toBeNull();
  });

  it("correctly find inside values", () => {
    expect(find(m, m.start.add(1, "millisecond"))).toBe(m.start);
    expect(find(m, m.end.subtract(1, "millisecond"))).toBe(m.end);

    let validPoint = m.start.add(m.stepSize).add(m.stepSize);
    expect(find(m, validPoint.add(1, "minute"))).toBe(validPoint);
    expect(find(m, validPoint.subtract(1, "minute"))).toBe(validPoint);
  });

  it("should correctly avoid overshooting the end", () => {
    // m2.end is not a valid point, so overshooting should return
    const m2: RadarDataService.Manifest = {
      ...m,
      end: dayjs("2026-01-01T00:59:00Z"),
    };

    expect(find(m2, m2.end)).toBe(dayjs("2026-01-01T00:55:00Z"));
  });
});
