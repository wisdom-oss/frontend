import {
  computed,
  effect,
  signal,
  Injectable,
  Signal,
  WritableSignal,
} from "@angular/core";
import dayjs, {Dayjs} from "dayjs";
import {Duration} from "dayjs/plugin/duration";
import {FeatureCollection, Geometry, Point, MultiPolygon} from "geojson";

import {GroundwaterLevelsService} from "../../api/groundwater-levels.service";
import {GeoDataService} from "../../api/geo-data.service";
import nlwknMeasurementClassificationColors from "../../assets/nlwkn-measurement-classification-colors.toml";
import {range} from "../../common/utils/range";
import {signals} from "../../common/signals";

export namespace GrowlService {
  // geo data
  export type GroundwaterBodies = MultiPolygons;
  export type GroundwaterMeasurementStations = Points<
    Partial<LenientMeasurement>
  >;
  export type NdsMunicipals = MultiPolygons;
  export type WaterRightUsageLocations = Points;

  // gl data
  export type MeasurementClassifications = Record<string, Measurement>;

  // derive data
  export type MeasurementClassificationCount = Record<
    keyof typeof nlwknMeasurementClassificationColors,
    number
  >;
}

type GroundwaterBodies = GrowlService.GroundwaterBodies;
type GroundwaterMeasurementStations =
  GrowlService.GroundwaterMeasurementStations;
type NdsMunicipals = GrowlService.NdsMunicipals;
type WaterRightUsageLocations = GrowlService.WaterRightUsageLocations;

type MeasurementClassifications = GrowlService.MeasurementClassifications;

type MeasurementClassificationCount =
  GrowlService.MeasurementClassificationCount;

@Injectable({
  providedIn: "root",
})
export class GrowlService {
  readonly selectMeasurementsDay = signal<0 | 1 | 2 | 3 | 4 | 5 | 6>(0);

  // prettier-ignore
  readonly data = {
    groundwaterBodies: computed(() => this.geo.groundwaterBodies())                           as Signal<GroundwaterBodies>,
    groundwaterMeasurementStations: computed(() => this.applyMeasurementDataToStations())     as Signal<GroundwaterMeasurementStations>,
    ndsMunicipals: computed(() => this.geo.ndsMunicipals())                                   as Signal<NdsMunicipals>,
    waterRightUsageLocations: computed(() => this.geo.waterRightUsageLocations())             as Signal<WaterRightUsageLocations>,
    oldWaterRightUsageLocations: computed(() => this.geo.oldWaterRightUsageLocations())       as Signal<WaterRightUsageLocations>,

    measurementClassificationCount: computed(() => this.calcMeasurementClassificationCount()) as Signal<MeasurementClassificationCount>,
    measurementsDate: computed(() => this.gl.lastWeek[this.selectMeasurementsDay()][0])       as Signal<Dayjs>,
  };

  private geo: {
    service: GeoDataService;
    groundwaterMeasurementStations: Signal<Points>;
    groundwaterBodies: Signal<MultiPolygons>;
    ndsMunicipals: Signal<MultiPolygons>;
    waterRightUsageLocations: Signal<Points>;
    oldWaterRightUsageLocations: Signal<Points>;
  };

  private gl: {
    service: GroundwaterLevelsService;
    measurementClassifications: WritableSignal<MeasurementClassifications>;
    lastWeek: {
      // today minus <index> days
      0: [Dayjs, Signal<MeasurementClassifications>];
      1: [Dayjs, Signal<MeasurementClassifications>];
      2: [Dayjs, Signal<MeasurementClassifications>];
      3: [Dayjs, Signal<MeasurementClassifications>];
      4: [Dayjs, Signal<MeasurementClassifications>];
      5: [Dayjs, Signal<MeasurementClassifications>];
      6: [Dayjs, Signal<MeasurementClassifications>];
    };
  };

  constructor(geo: GeoDataService, gl: GroundwaterLevelsService) {
    this.geo = GrowlService.constructGeoDataSignals(geo);
    this.gl = GrowlService.constructGlDataSignals(gl);

    effect(() => {
      let selectedDay = this.selectMeasurementsDay();
      let data = this.gl.lastWeek[selectedDay][1]();
      this.gl.measurementClassifications.set(data);
    });
  }

  private static constructGeoDataSignals(
    service: GeoDataService,
  ): GrowlService["geo"] {
    return {
      service,
      groundwaterMeasurementStations: GrowlService.geoDataSignal(
        service,
        "groundwater_measurement_stations",
        "Point",
        dayjs.duration(1, "week"),
      ),
      groundwaterBodies: GrowlService.geoDataSignal(
        service,
        "groundwater_bodies",
        "MultiPolygon",
        dayjs.duration(1, "year"),
      ),
      ndsMunicipals: GrowlService.geoDataSignal(
        service,
        "nds_municipals",
        "MultiPolygon",
        dayjs.duration(1, "year"),
      ),
      waterRightUsageLocations: GrowlService.geoDataSignal(
        service,
        "water_right_usage_locations",
        "Point",
        dayjs.duration(1, "week"),
      ),
      oldWaterRightUsageLocations: GrowlService.geoDataSignal(
        service,
        "old_water_right_usage_locations",
        "Point",
        dayjs.duration(1, "week"),
      ),
    };
  }

  private static geoDataSignal<G extends Geometry>(
    service: GeoDataService,
    layerName: string,
    type: G["type"],
    cacheTtl: Duration,
  ): Signal<FeatureCollection<G, GeoProperties>> {
    return signals.map(
      service.fetchLayerContents(layerName, undefined, cacheTtl),
      contents => ({
        type: "FeatureCollection",
        features: (contents?.data ?? [])
          .filter(({geometry, ...content}) => {
            let isExpectedType = geometry.type === type;
            let msg = `expected "${type}, got "${geometry.type}"`;
            if (!isExpectedType) console.warn(msg, content);
            return isExpectedType;
          })
          .map(({geometry, id, name, key, additionalProperties}) => ({
            type: "Feature",
            geometry: geometry as G,
            id,
            properties: {name, key, ...additionalProperties},
          })),
      }),
    );
  }

  private static constructGlDataSignals(
    service: GroundwaterLevelsService,
  ): GrowlService["gl"] {
    let today = dayjs();
    let week = range(7);
    let measurements = Object.fromEntries(
      week.map(i => {
        let day = today.subtract(dayjs.duration(i, "day"));
        return [
          i,
          [
            day,
            signals.map(
              service.fetchMeasurementClassifications(day),
              data => data || {},
            ),
          ],
        ];
      }),
    ) as GrowlService["gl"]["lastWeek"];

    return {
      service,
      measurementClassifications: signal(measurements[0][1]()),
      lastWeek: measurements,
    };
  }

  private calcMeasurementClassificationCount(): MeasurementClassificationCount {
    let measurements = this.gl.measurementClassifications();

    const MC = GroundwaterLevelsService.MeasurementClassification;
    let count = {
      [MC.MAX_EXCEEDED]: 0,
      [MC.VERY_HIGH]: 0,
      [MC.HIGH]: 0,
      [MC.NORMAL]: 0,
      [MC.LOW]: 0,
      [MC.VERY_LOW]: 0,
      [MC.MIN_UNDERSHOT]: 0,
      null: 0,
    };

    for (let {classification} of Object.values(measurements)) {
      count[classification || "null"]++;
    }

    return count;
  }

  private applyMeasurementDataToStations(): GroundwaterMeasurementStations {
    let stations = this.geo.groundwaterMeasurementStations();
    let measurements = this.gl.measurementClassifications();

    return {
      type: "FeatureCollection",
      features: stations.features.map(station => {
        let measurement = measurements[station.properties.key] ?? {};
        return {
          type: "Feature" as const,
          geometry: station.geometry,
          properties: {
            ...station.properties,
            ...measurement,
            classification: measurement.classification ?? "null",
          },
        };
      }),
    };
  }
}

type Measurement = GroundwaterLevelsService.Measurement;
type LenientMeasurement = Omit<Measurement, "classification"> & {
  classification: GroundwaterLevelsService.MeasurementClassification | "null";
};

type GeoProperties<P = {}> = {name?: string | null; key: string} & P;
type Points<P = {}> = FeatureCollection<Point, GeoProperties<P>>;
type MultiPolygons<P = {}> = FeatureCollection<MultiPolygon, GeoProperties<P>>;
