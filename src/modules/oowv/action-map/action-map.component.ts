import {NgIf} from "@angular/common";
import {effect, signal, Component, Signal} from "@angular/core";
import {
  ControlComponent,
  ImageComponent,
  LayerComponent,
  MapComponent,
  GeoJSONSourceComponent,
  NavigationControlDirective,
} from "@maplibre/ngx-maplibre-gl";
import dayjs from "dayjs";
import {FeatureCollection, Feature, Geometry} from "geojson";
import {StyleSpecification} from "maplibre-gl";

import {GeoDataService} from "../../../api/geo-data.service";
import colorful from "../../../assets/map/styles/colorful.json";
import {LayerSelectionControlComponent} from "../../../common/components/map/layer-selection-control/layer-selection-control.component";
import {signals} from "../../../common/signals";
import {Scopes} from "../../../core/auth/scopes";

@Component({
  selector: "oowv-action-map",
  imports: [
    ControlComponent,
    GeoJSONSourceComponent,
    ImageComponent,
    LayerComponent,
    LayerSelectionControlComponent,
    MapComponent,
    NavigationControlDirective,
    NgIf,
  ],
  templateUrl: "./action-map.component.html",
  styles: ``,
})
export class OowvActionMapComponent {
  static readonly SCOPES: Scopes.Scope[] = ["geodata:read"];

  protected style = colorful as any as StyleSpecification;

  protected selectedLayers = {
    infiltration_areas: signals.toggleable(true),
    trench_register: signals.toggleable(true),
    heavy_rain_simulation: signals.toggleable(true),
    emergency_flow_ways: signals.toggleable(true),
    heavy_rain_flooded_streets: signals.toggleable(true),
    greenable_roofs: signals.toggleable(true),
    heavy_rain_traffic_control: signals.toggleable(true),
    heavy_rain_flooded_bus_stops: signals.toggleable(true),
  } as const;
  protected initialLoad = signal(false);
  protected selectedLayersUpdate = signal(false);

  protected geoData: Record<
    keyof OowvActionMapComponent["selectedLayers"],
    Signal<any>
  >;

  constructor(geo: GeoDataService) {
    this.geoData = Object.fromEntries(
      Object.keys(this.selectedLayers).map(key => [
        key,
        signals.fromPromise(
          geo.fetchLayerContents(key, undefined, dayjs.duration(3, "months")),
          this.intoFeatureCollection,
        ),
      ]),
    ) as OowvActionMapComponent["geoData"];

    effect(() => {
      for (let data of Object.values(this.geoData)) {
        if (!data()) return;
      }

      this.initialLoad.set(true);
    });

    effect(() => {
      if (!this.initialLoad()) return;
      for (let selected of Object.values(this.selectedLayers)) selected();
      this.selectedLayersUpdate.set(false);
      setTimeout(() => this.selectedLayersUpdate.set(true));
    });
  }

  private intoFeatureCollection<G extends Geometry>(
    contents: GeoDataService.LayerContents | null,
  ): FeatureCollection<G> {
    let features: Feature<G>[] = [];

    for (let content of contents?.data ?? []) {
      features.push({
        type: "Feature",
        geometry: content.geometry as G,
        properties: null,
      });
    }

    return {type: "FeatureCollection", features};
  }
}
