import {Component} from "@angular/core";
import {MapComponent} from "@maplibre/ngx-maplibre-gl";
import {StyleSpecification} from "maplibre-gl";

import colorful from "../../../assets/map/styles/colorful.json";
import {Scopes} from "../../../core/auth/scopes";

@Component({
  selector: "oowv-action-map",
  imports: [MapComponent],
  templateUrl: "./action-map.component.html",
  styles: ``,
})
export class OowvActionMapComponent {
  static readonly SCOPES: Scopes.Scope[] = [];

  protected style = colorful as any as StyleSpecification;
}
