import {computed, effect, inject, Component} from "@angular/core";
import {
  ControlComponent,
  LayerComponent,
  MapComponent,
  ImageSourceComponent,
  NavigationControlDirective,
} from "@maplibre/ngx-maplibre-gl";
import {ImageSourceSpecification, StyleSpecification} from "maplibre-gl";

import {RadarDataService} from "./radar-data.service";
import colorful from "../../assets/map/styles/colorful.json";
import {ResizeMapOnLoadDirective} from "../../common/directives/resize-map-on-load.directive";

@Component({
  imports: [
    ControlComponent,
    ImageSourceComponent,
    LayerComponent,
    MapComponent,
    NavigationControlDirective,
    ResizeMapOnLoadDirective,
  ],
  templateUrl: "./radar-data.component.html",
})
export class RadarDataComponent {
  protected service = inject(RadarDataService);

  protected style = colorful as any as StyleSpecification;

  protected manifest = this.service.fetchManifest();
  protected coordinates = computed<
    ImageSourceSpecification["coordinates"] | undefined
  >(() => {
    const bbox = this.manifest()?.bbox;
    if (!bbox) return undefined;

    const [west, south, east, north] = bbox;
    return [
      [west, north],
      [east, north],
      [east, south],
      [west, south],
    ];
  });

  private _manifest = effect(() => console.log(this.manifest()));
  private _coordinates = effect(() => console.log(this.coordinates()));
}
