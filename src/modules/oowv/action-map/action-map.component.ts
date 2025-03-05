import {Component} from "@angular/core";
import {ControlComponent, MapComponent} from "@maplibre/ngx-maplibre-gl";
import {StyleSpecification} from "maplibre-gl";

import colorful from "../../../assets/map/styles/colorful.json";
import {Scopes} from "../../../core/auth/scopes";
import { LayerSelectionControlComponent } from "../../../common/components/map/layer-selection-control/layer-selection-control.component";

@Component({
  selector: "oowv-action-map",
  imports: [MapComponent, LayerSelectionControlComponent, ControlComponent],
  templateUrl: "./action-map.component.html",
  styles: ``,
})
export class OowvActionMapComponent {
  static readonly SCOPES: Scopes.Scope[] = [];

  protected style = colorful as any as StyleSpecification;
}
