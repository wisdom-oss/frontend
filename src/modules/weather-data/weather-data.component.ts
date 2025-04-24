import {KeyValuePipe} from "@angular/common";
import {
  computed,
  effect,
  signal,
  viewChild,
  Component,
  Signal,
  WritableSignal,
} from "@angular/core";
import {ActivatedRoute, Router} from "@angular/router";
import {
  ControlComponent,
  LayerComponent,
  MapComponent,
  GeoJSONSourceComponent,
  NavigationControlDirective,
} from "@maplibre/ngx-maplibre-gl";
import {TranslateDirective} from "@ngx-translate/core";
import {BBox} from "geojson";
import {StyleSpecification} from "maplibre-gl";

import * as turf from "@turf/turf";

import {DwdService} from "../../api/dwd.service";
import colorful from "../../assets/map/styles/colorful.json";
import {LayerSelectionControlComponent} from "../../common/components/map/layer-selection-control/layer-selection-control.component";
import {signals} from "../../common/signals";
import {ClusterPolygonSourceDirective} from "../../common/directives/cluster-polygon-source.directive";
import {ResizeMapOnLoadDirective} from "../../common/directives/resize-map-on-load.directive";
import {ResizeObserverDirective} from "../../common/directives/resize-observer.directive";
import {MapCursorDirective} from "../../common/directives/map-cursor.directive";
import {cast} from "../../common/utils/cast";

type Stations = DwdService.V2.Stations;

@Component({
  imports: [
    ClusterPolygonSourceDirective,
    ControlComponent,
    GeoJSONSourceComponent,
    KeyValuePipe,
    LayerComponent,
    LayerSelectionControlComponent,
    MapComponent,
    MapCursorDirective,
    NavigationControlDirective,
    ResizeMapOnLoadDirective,
    ResizeObserverDirective,
    TranslateDirective,
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
  protected hoverStationId = signal<undefined | string>(undefined);
  protected hoverStationClusterId = signal<undefined | number>(undefined);
  protected stations: Signal<undefined | Stations>;
  protected filteredStations = computed(() => this.filterStations());
  protected layers = computed(() => this.determineLayers());

  protected selectedStationId = signal<undefined | string>(undefined);
  protected selectedStation = computed(() => {
    let stations = this.stations();
    let stationId = this.selectedStationId();
    if (!stations || !stationId) return undefined;
    return stations.features.find(
      feature => feature.properties.id == stationId,
    );
  });

  protected selectedProduct = signal<undefined | string>(undefined);
  protected selectedResolution = signal<undefined | string>(undefined);

  protected util = {
    cast,
    log: (...args: any[]) => console.log(...args),
  };

  constructor(
    private service: DwdService,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    this.selectedStationId.set(route.snapshot.queryParams["station"]);
    effect(() =>
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {station: this.selectedStationId()},
      }),
    );

    this.stations = signals.fromPromise(this.service.v2.fetchStations());

    effect(() => console.log(this.selectedStation()));

    effect(() => {
      let station = this.selectedStation();
      if (!station) return;
      let bbox = turf.bbox(station.geometry);
      let padding = 0.01;
      bbox[0] -= padding;
      bbox[1] -= padding;
      bbox[2] += padding;
      bbox[3] += padding;
      // update map after selector appeared
      setTimeout(() => this.fitBounds.set(bbox));
    });

    effect(() => {
      // reset product when switching stations
      this.selectedStation();
      this.selectedProduct.set(undefined);
    });

    effect(() => {
      // reset resolution when switching product
      this.selectedProduct();
      this.selectedResolution.set(undefined);
    });
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
