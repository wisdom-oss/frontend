import {input, Component} from "@angular/core";
import {
  LayerComponent,
  MapComponent,
  GeoJSONSourceComponent,
} from "@maplibre/ngx-maplibre-gl";
import {StyleSpecification} from "maplibre-gl";

import colorful from "../../../../assets/map/styles/colorful.json";

@Component({
  selector: "map-view",
  imports: [MapComponent, LayerComponent, GeoJSONSourceComponent],
  templateUrl: "./map-view.component.html",
})
export class MapViewComponent {
  readonly locations = input.required<GeoJSON.FeatureCollection>();
  readonly zoom = input.required<number>();
  readonly center = input.required<{lon: number; lat: number}>();

  protected style = colorful as any as StyleSpecification;
}
