import {
  computed,
  effect,
  signal,
  viewChild,
  Component,
  Signal,
  WritableSignal,
} from "@angular/core";
import {
  ControlComponent,
  LayerComponent,
  MapComponent,
  GeoJSONSourceComponent,
  NavigationControlDirective,
} from "@maplibre/ngx-maplibre-gl";
import {TranslateDirective} from "@ngx-translate/core";
import {geometry} from "@turf/turf";
import {BBox, FeatureCollection, Point} from "geojson";
import {StyleSpecification} from "maplibre-gl";

import {DwdService} from "../../api/dwd.service";
import colorful from "../../assets/map/styles/colorful.json";
import {LayerSelectionControlComponent} from "../../common/components/map/layer-selection-control/layer-selection-control.component";
import {signals} from "../../common/signals";
import {ClusterPolygonSourceDirective} from "../../common/directives/cluster-polygon-source.directive";
import {ResizeMapOnLoadDirective} from "../../common/directives/resize-map-on-load.directive";
import {ResizeObserverDirective} from "../../common/directives/resize-observer.directive";
import {MapCursorDirective} from "../../common/directives/map-cursor.directive";
import {cast} from "../../common/utils/cast";
import {typeUtils} from "../../common/utils/type-utils";

type Stations = {
  type: "FeatureCollection";
  features: {
    type: "Feature";
    geometry: DwdService.V2.Stations["features"][0]["geometry"];
    properties: DwdService.V2.Stations["features"][0]["properties"] & {
      id: string;
    };
  }[];
};

@Component({
  imports: [
    ControlComponent,
    GeoJSONSourceComponent,
    LayerComponent,
    LayerSelectionControlComponent,
    MapComponent,
    NavigationControlDirective,
    TranslateDirective,
    ClusterPolygonSourceDirective,
    ResizeMapOnLoadDirective,
    ResizeObserverDirective,
    MapCursorDirective,
  ],
  templateUrl: "./weather-data.component.html",
})
export class WeatherDataComponent {
  protected colorful = colorful as any as StyleSpecification;
  protected clusterPolygonSource = viewChild.required(
    ClusterPolygonSourceDirective,
  );

  protected layout = signal<"row" | "column">("row");
  protected cursor = computed(() =>
    this.hoverStationId() || this.hoverStationClusterId() ? "pointer" : "grab",
  );

  protected fitBounds = signal<BBox | undefined>(undefined);
  protected hoverStationId = signal<null | string>(null);
  protected hoverStationClusterId = signal<null | number>(null);
  protected stations: Signal<undefined | Stations>;
  protected filteredStations = computed(() => this.filterStations());
  protected layers = computed(() => this.determineLayers());

  protected util = {
    cast,
    log: (...args: any[]) => console.log(...args),
  };

  constructor(private service: DwdService) {
    this.stations = signals.fromPromise(
      this.service.v2.fetchStations(),
      stations => {
        // TODO: make this obsolete in the backend
        let features = stations.features.map(feature => ({
          type: "Feature" as const,
          id: feature.id,
          geometry: feature.geometry,
          properties: {
            ...feature.properties,
            id: feature.id,
          },
        }));

        return {type: "FeatureCollection", features};
      },
    );

    effect(() => console.log(this.hoverStationId()));
  }

  protected onColumnsResize([entry]: ResizeObserverEntry[]): void {
    let width = entry.borderBoxSize[0].inlineSize;
    this.layout.set(width < 700 ? "column" : "row");
  }

  private determineLayers(): Record<
    string,
    signals.ToggleableSignal<WritableSignal<boolean>>
  > {
    let properties = new Set<string>();
    for (let feature of this.stations()?.features ?? []) {
      for (let property in feature.properties.products)
        properties.add(property);
    }

    return Object.fromEntries(
      Array.from(properties.values()).map(key => [
        key,
        signals.toggleable(true),
      ]),
    );
  }

  private filterStations(): Stations {
    let empty: Stations = {
      type: "FeatureCollection",
      features: [],
    };

    let stations = this.stations();
    if (!stations) return empty;

    let layers = this.layers();
    let activeLayers = new Set<string>();
    for (let [layer, signal] of Object.entries(layers)) {
      if (signal()) activeLayers.add(layer);
    }

    let features = stations.features.filter(feature => {
      for (let product in feature.properties.products) {
        if (activeLayers.has(product)) return true;
      }

      return false;
    });

    return {type: "FeatureCollection", features};
  }
}
