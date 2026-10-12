import {effect, inject, Component} from "@angular/core";
import {
  ControlComponent,
  MapComponent,
  NavigationControlDirective,
} from "@maplibre/ngx-maplibre-gl";
import {StyleSpecification} from "maplibre-gl";

import {RadarDataService} from "./radar-data.service";
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
  protected service = inject(RadarDataService);

  protected style = colorful as any as StyleSpecification;
  protected manifest = this.service.fetchManifest();

  private _manifest = effect(() => console.log(this.manifest()));
}
