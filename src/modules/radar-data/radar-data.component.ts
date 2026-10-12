import {Component} from "@angular/core";
import {
  ControlComponent,
  MapComponent,
  NavigationControlDirective,
} from "@maplibre/ngx-maplibre-gl";
import {StyleSpecification} from "maplibre-gl";

import colorful from "../../assets/map/styles/colorful.json";
import {ResizeMapOnLoadDirective} from "../../common/directives/resize-map-on-load.directive";

@Component({
  imports: [
    ControlComponent,
    MapComponent,
    NavigationControlDirective,
    ResizeMapOnLoadDirective,
  ],
  templateUrl: "./radar-data.component.html",
})
export class RadarDataComponent {
  protected style = colorful as any as StyleSpecification;
}
