import {
  computed,
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
import {BBox} from "geojson";
import {StyleSpecification} from "maplibre-gl";

import {DwdService} from "../../api/dwd.service";
import colorful from "../../assets/map/styles/colorful.json";
import {LayerSelectionControlComponent} from "../../common/components/map/layer-selection-control/layer-selection-control.component";
import {signals} from "../../common/signals";
import {ClusterPolygonSourceDirective} from "../../common/directives/cluster-polygon-source.directive";
import {ResizeMapOnLoadDirective} from "../../common/directives/resize-map-on-load.directive";
import {ResizeObserverDirective} from "../../common/directives/resize-observer.directive";

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
  ],
  templateUrl: "./weather-data.component.html",
})
export class WeatherDataComponent {
  protected colorful = colorful as any as StyleSpecification;
  protected clusterPolygonSource = viewChild.required(
    ClusterPolygonSourceDirective,
  );

  protected layout = signal<"row" | "column">("row");

  protected fitBounds = signal<BBox | undefined>(undefined);
  protected hoverStationClusterId = signal<null | number>(null);
  protected stations: Signal<undefined | DwdService.V2.Stations>;
  protected filteredStations = computed(() => this.filterStations());
  protected layers = computed(() => this.determineLayers());

  constructor(private service: DwdService) {
    this.stations = signals.fromPromise(this.service.v2.fetchStations());
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

  private filterStations(): DwdService.V2.Stations {
    let empty: DwdService.V2.Stations = {
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
