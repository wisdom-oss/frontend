import {effect, Component, Signal} from "@angular/core";
import {
  ControlComponent,
  MapComponent,
  GeoJSONSourceComponent,
  LayerComponent,
  NavigationControlDirective,
  ImageSourceComponent,
  ImageComponent,
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
    LayerComponent,
    LayerSelectionControlComponent,
    MapComponent,
    NavigationControlDirective,
    ImageComponent,
  ],
  templateUrl: "./action-map.component.html",
  styles: ``,
})
export class OowvActionMapComponent {
  static readonly SCOPES: Scopes.Scope[] = ["geodata:read"];

  protected style = colorful as any as StyleSpecification;

  protected selectedLayers = {
    infiltration_areas: signals.toggleable(false),
    trench_register: signals.toggleable(false),
    heavy_rain_simulation: signals.toggleable(false),
    emergency_flow_ways: signals.toggleable(false),
    heavy_rain_flooded_streets: signals.toggleable(false),
    greenable_roofs: signals.toggleable(true),
    heavy_rain_traffic_control: signals.toggleable(false),
    heavy_rain_flooded_bus_stops: signals.toggleable(false),
  } as const;

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
  }

  private intoFeatureCollection<G extends Geometry>(
    contents: GeoDataService.LayerContents | null,
  ): FeatureCollection<G> {
    let features: Feature<G>[] = [];

    for (let content of contents ?? []) {
      features.push({
        type: "Feature",
        geometry: content.geometry as G,
        properties: null,
      });
    }

    return {type: "FeatureCollection", features};
  }
}
