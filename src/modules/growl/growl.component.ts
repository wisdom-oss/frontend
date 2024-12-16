import {Component} from "@angular/core";
import {MapComponent} from "@maplibre/ngx-maplibre-gl";
import {StyleSpecification} from "maplibre-gl";

import colorful from "../../common/map/styles/colorful.json";

@Component({
  selector: "wisdom-growl",
  imports: [MapComponent],
  templateUrl: "./growl.component.html",
  styles: ``,
})
export class GrowlComponent {
  readonly style = colorful as any as StyleSpecification;
}
