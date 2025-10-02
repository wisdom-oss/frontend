import {NgIf, DatePipe, KeyValuePipe} from "@angular/common";
import {
  computed,
  effect,
  inject,
  resource,
  signal,
  viewChild,
  Component,
  ResourceLoaderParams,
  Signal,
} from "@angular/core";
import {
  ControlComponent,
  ImageComponent,
  LayerComponent,
  MapComponent,
  GeoJSONSourceComponent,
  AttributionControlDirective,
  NavigationControlDirective,
} from "@maplibre/ngx-maplibre-gl";
import dayjs from "dayjs";
import {BBox, Feature, Point, Polygon} from "geojson";
import {StyleSpecification} from "maplibre-gl";

import * as turf from "@turf/turf";

import {DisplayInfoControlComponent} from "./map/display-info-control/display-info-control.component";
import {LegendControlComponent} from "./map/legend-control/legend-control.component";
import {GrowlService} from "./growl.service";
import {WithdrawalInfoControlComponent} from "./map/withdrawal-info-control/withdrawal-info-control.component";
import {WaterRightsService} from "../../api/water-rights.service";
import nlwknMeasurementClassificationColors from "../../assets/nlwkn-measurement-classification-colors.toml";
import colorful from "../../assets/map/styles/colorful.json";
import {LayerSelectionControlComponent} from "../../common/components/map/layer-selection-control/layer-selection-control.component";
import {ResizeMapOnLoadDirective} from "../../common/directives/resize-map-on-load.directive";
import {signals} from "../../common/signals";
import {RecreateOnDirective} from "../../common/directives/recreate-on.directive";
import {keys} from "../../common/utils/keys";
import {omit} from "../../common/utils/omit";

@Component({
  imports: [
    AttributionControlDirective,
    ControlComponent,
    DatePipe,
    DisplayInfoControlComponent,
    GeoJSONSourceComponent,
    ImageComponent,
    KeyValuePipe,
    LayerComponent,
    LayerSelectionControlComponent,
    LegendControlComponent,
    MapComponent,
    NavigationControlDirective,
    NgIf,
    RecreateOnDirective,
    ResizeMapOnLoadDirective,
    WithdrawalInfoControlComponent,
  ],
  templateUrl: "./growl.component.html",
})
export class GrowlComponent {
  protected service = inject(GrowlService);
  private waterRightsService = inject(WaterRightsService);

  protected style = colorful as any as StyleSpecification;
  protected measurementColors = nlwknMeasurementClassificationColors;

  // prettier-ignore
  protected hoveredFeatures = {
    groundwaterMeasurementStation: signal<GroundwaterMeasurementStationFeature | null>(null),
    groundwaterBody: signal<GroundwaterBodyFeature | null>(null),
    ndsMunicipal: signal<NdsMunicipalFeature | null>(null),
    waterRightUsageLocationCluster: signal<ClusterFeature | null>(
      null, {equal: (a, b) => a?.id == b?.id}
    ),
  };

  protected selectedLayers = {
    waterRightUsageLocations: signals.toggleable(false),
    oldWaterRightUsageLocations: signals.toggleable(false),
    groundwaterLevelStations: signals.toggleable(true),
    ndsMunicipals: signals.toggleable(false),
    groundwaterBodies: signals.toggleable(true),
  } as const;
  protected selectedLayersUpdate = signal(false);

  protected attribution = computed(() => {
    return keys(omit(this.selectedLayers, "groundwaterLevelStations"))
      .filter(key => this.selectedLayers[key]())
      .map(key => this.service.data[key]())
      .filter(({attribution}) => !!attribution)
      .map(({attribution, attributionURL}) => {
        if (!attributionURL) return attribution;
        return `<a href="${attributionURL}" target="_blank">${attribution}</a>`;
      })
      .reduce((attributions, value) => {
        if (!attributions?.includes(value!)) attributions.push(value!);
        return attributions;
      }, [] as string[]);
  });

  protected fitBounds = signal<BBox | undefined>(undefined);

  protected waterRightUsageLocationsSource: Signal<GeoJSONSourceComponent> =
    viewChild.required("waterRightUsageLocationsSource");
  protected oldWaterRightUsageLocationsSource: Signal<GeoJSONSourceComponent> =
    viewChild.required("oldWaterRightUsageLocationsSource");
  protected hoverClusterPolygon;
  // additional delay to fix angular error for outputting event data of destroyed component
  protected hoverClusterPolygonDelay;

  protected groundwaterBodyRequest = signal<GroundwaterBodyFeature | null>(
    null,
  );
  protected averageWithdrawalsRequest = computed(() => {
    let groundwaterBody = this.groundwaterBodyRequest();
    if (this.hoverClusterPolygon.hasValue()) return;

    for (let body of this.service.data.groundwaterBodies().data.features) {
      if (groundwaterBody?.id == body.id) {
        return body;
      }
    }

    return null;
  });
  protected averageWithdrawalsResponse =
    this.waterRightsService.fetchAverageWithdrawals(
      computed(() => {
        let geometry = this.averageWithdrawalsRequest()?.geometry;
        return geometry ? [geometry] : undefined;
      }),
    );
  protected averageWithdrawals = computed(() => {
    let withdrawals = this.averageWithdrawalsResponse();
    if (!withdrawals) return null;

    let request = this.averageWithdrawalsRequest();
    if (!request) return null;

    return {
      name: request.properties.name ?? request.properties.key,
      key: request.properties.key,
      withdrawals,
    };
  });

  protected lang = signals.lang();
  private initialLoad = computed(() => {
    return (
      !!this.service.data.groundwaterMeasurementStations().features.length &&
      !!this.service.data.groundwaterBodies().data.features.length
    );
  });

  constructor() {
    effect(() => {
      // force layer order by redrawing them on every update
      this.initialLoad();
      for (let s of Object.values(this.selectedLayers)) s();
      this.selectedLayersUpdate.set(false);
      setTimeout(() => this.selectedLayersUpdate.set(true));
    });

    this.hoverClusterPolygon = this.hoverClusterPolygonResource();
    this.hoverClusterPolygonDelay = signals.delay(
      this.hoverClusterPolygon.value,
    );
    effect(() => {
      // when zooming in, remove that visual box
      this.fitBounds();
      this.hoverClusterPolygon.set(undefined);
    });
  }

  protected displayGroundwaterMeasurementStation(
    feature: GroundwaterMeasurementStationFeature | null,
  ): DisplayInfoControlComponent.Data | null {
    if (!feature) return null;
    let date = feature.properties.date;
    return {
      title: feature.properties.name,
      table: {
        station: feature.properties.station,
        date: date ? dayjs(date) : undefined,
        waterLevelNHN: feature.properties.waterLevelNHN,
        waterLevelGOK: feature.properties.waterLevelGOK,
      },
    };
  }

  protected displayGroundwaterBody(
    feature: GroundwaterBodyFeature | null,
  ): DisplayInfoControlComponent.Data | null {
    if (!feature) return null;
    return {
      title: feature.properties.name,
      subtitle: feature.properties.key,
    };
  }

  protected displayNdsMunicipal(
    feature: NdsMunicipalFeature | null,
  ): DisplayInfoControlComponent.Data | null {
    if (!feature) return null;
    return {
      title: feature.properties.name,
      subtitle: feature.properties.key,
    };
  }

  protected selectMeasurementDay(value: 0 | 1 | 2 | 3 | 4 | 5 | 6) {
    this.service.selectMeasurementsDay.set(value);
  }

  private hoverClusterPolygonResource() {
    return resource({
      params: () => {
        let cluster = this.hoveredFeatures.waterRightUsageLocationCluster();
        if (!cluster) return null;

        let source = this.waterRightUsageLocationsSource();
        if (!source) return null;

        let oldSource = this.oldWaterRightUsageLocationsSource();
        if (!oldSource) return null;

        return [[source, oldSource], cluster] as [
          [GeoJSONSourceComponent, GeoJSONSourceComponent],
          ClusterFeature,
        ];
      },
      loader: async (
        param: ResourceLoaderParams<
          | [[GeoJSONSourceComponent, GeoJSONSourceComponent], ClusterFeature]
          | null
        >,
      ): Promise<Feature<Polygon> | undefined> => {
        if (!param.params) return undefined;
        let [[source, oldSource], cluster] = param.params;
        let points;
        try {
          points = await this.getClusterChildrenRecursive(
            source,
            cluster.id! as number,
            3,
          );
        } catch {
          points = await this.getClusterChildrenRecursive(
            oldSource,
            cluster.id! as number,
            3,
          );
        }
        let featureCollection = {
          type: "FeatureCollection",
          features: points,
        } as const;
        let polygon = turf.convex(featureCollection);
        if (!polygon) return undefined;
        polygon.bbox = turf.bbox(polygon);
        return polygon;
      },
    });
  }

  private async getClusterChildrenRecursive(
    source: GeoJSONSourceComponent,
    clusterId: number,
    depthLimit: number,
  ): Promise<Feature[]> {
    // TODO: implement a depth limit
    let points = [];
    let children = await source.getClusterChildren(clusterId);
    for (let child of children) {
      if ((child.properties ?? {})["cluster"] && depthLimit) {
        points.push(
          ...(await this.getClusterChildrenRecursive(
            source,
            child.id! as number,
            depthLimit - 1,
          )),
        );
        continue;
      }

      points.push(child);
    }

    return points;
  }
}

type GroundwaterMeasurementStationFeature =
  GrowlService.GroundwaterMeasurementStations["features"][0];
type GroundwaterBodyFeature = GrowlService.GroundwaterBodies["features"][0];
type NdsMunicipalFeature = GrowlService.NdsMunicipals["features"][0];
type ClusterFeature = Feature<
  Point,
  {
    cluster: true;
    cluster_id: number;
    point_count: number;
    point_count_abbreviated: number | string;
  }
>;
