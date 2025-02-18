import {
  computed,
  signal,
  Injectable,
  Signal,
  WritableSignal,
} from "@angular/core";
import {
  FeatureCollection,
  Feature,
  Geometry,
  Point,
  MultiPolygon,
  Polygon,
} from "geojson";

import {GroundwaterLevelsService} from "../../api/groundwater-levels.service";
import {GeoDataService} from "../../api/geo-data.service";
import nlwknMeasurementClassificationColors from "../../assets/nlwkn-measurement-classification-colors.toml";

export namespace GrowlService {
  // geo data
  export type GroundwaterBodies = Polygons;
  export type GroundwaterMeasurementStations = Points<Partial<Measurement>>;
  export type NdsMunicipals = MultiPolygons;
  export type WaterRightUsageLocations = Points;

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

type MeasurementClassificationCount =
  GrowlService.MeasurementClassificationCount;

@Injectable({
  providedIn: "root",
})
export class GrowlService {
  // prettier-ignore
  readonly data = {
    groundwaterBodies: computed(() => this.geo.groundwaterBodies())                           as Signal<GroundwaterBodies>,
    groundwaterMeasurementStations: computed(() => this.applyMeasurementDataToStations())     as Signal<GroundwaterMeasurementStations>,
    ndsMunicipals: computed(() => this.geo.ndsMunicipals())                                   as Signal<NdsMunicipals>,
    waterRightUsageLocations: computed(() => this.geo.waterRightUsageLocations())             as Signal<WaterRightUsageLocations>,
    oldWaterRightUsageLocations: computed(() => this.geo.oldWaterRightUsageLocations())       as Signal<WaterRightUsageLocations>,

    measurementClassificationCount: computed(() => this.calcMeasurementClassificationCount()) as Signal<MeasurementClassificationCount>,
  };

  private geo: {
    service: GeoDataService;
    groundwaterMeasurementStations: Signal<Points>;
    groundwaterBodies: Signal<Polygons>;
    ndsMunicipals: Signal<MultiPolygons>;
    waterRightUsageLocations: Signal<Points>;
    oldWaterRightUsageLocations: Signal<Points>;
  };

  private gl: {
    service: GroundwaterLevelsService;
    measurementClassifications: WritableSignal<Record<string, Measurement>>;
  };

  constructor(geo: GeoDataService, gl: GroundwaterLevelsService) {
    this.geo = GrowlService.constructGeoDataSignals(geo);
    this.gl = GrowlService.constructGlDataSignals(gl);
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
      ),
      groundwaterBodies: GrowlService.geoDataSignal(
        service,
        "groundwater_bodies",
        "Polygon",
      ),
      ndsMunicipals: GrowlService.geoDataSignal(
        service,
        "nds_municipals",
        "MultiPolygon",
      ),
      waterRightUsageLocations: GrowlService.geoDataSignal(
        service,
        "water_right_usage_locations",
        "Point",
      ),
      oldWaterRightUsageLocations: GrowlService.geoDataSignal(
        service,
        "old_water_right_usage_locations",
        "Point",
      ),
    };
  }

  private static geoDataSignal<G extends Geometry>(
    service: GeoDataService,
    layerName: string,
    type: G["type"],
  ): Signal<FeatureCollection<G, GeoProperties>> {
    let geoSignal: WritableSignal<FeatureCollection<G, GeoProperties>> = signal(
      {
        type: "FeatureCollection",
        features: [],
      },
    );

    (async () => {
      let contents = (await service.fetchLayerContents(layerName)) ?? [];

      let features: Feature<G, GeoProperties>[] = [];
      for (let content of contents) {
        if (content.geometry.type !== type) {
          let msg = `expected "${type}", got "${content.geometry.type}"`;
          console.warn(msg, content);
          continue;
        }

        features.push({
          type: "Feature",
          geometry: content.geometry as G,
          id: content.id,
          properties: {
            name: content.name,
            key: content.key,
            ...content.additionalProperties,
          },
        });

        geoSignal.set({
          type: "FeatureCollection",
          features,
        });
      }
    })();

    return geoSignal;
  }

  private static constructGlDataSignals(
    service: GroundwaterLevelsService,
  ): GrowlService["gl"] {
    let measurementClassifications = signal({});
    service
      .fetchMeasurementClassifications()
      .then(data => measurementClassifications.set(data));

    return {
      service,
      measurementClassifications,
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
            classification: measurement.classification,
          },
        };
      }),
    };
  }
}

type Measurement = GroundwaterLevelsService.Measurement;

type GeoProperties<P = {}> = {name?: string | null; key: string} & P;
type Points<P = {}> = FeatureCollection<Point, GeoProperties<P>>;
type Polygons<P = {}> = FeatureCollection<Polygon, GeoProperties<P>>;
type MultiPolygons<P = {}> = FeatureCollection<MultiPolygon, GeoProperties<P>>;
