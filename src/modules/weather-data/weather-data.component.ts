import {Component, Signal} from "@angular/core";
import {
  ControlComponent,
  GeoJSONSourceComponent,
  MapComponent,
  NavigationControlDirective,
} from "@maplibre/ngx-maplibre-gl";
import {TranslateDirective} from "@ngx-translate/core";
import {StyleSpecification} from "maplibre-gl";

import {DwdService} from "../../api/dwd.service";
import colorful from "../../assets/map/styles/colorful.json";
import {LayerSelectionControlComponent} from "../../common/components/map/layer-selection-control/layer-selection-control.component";
import {signals} from "../../common/signals";

@Component({
  imports: [
    ControlComponent,
    LayerSelectionControlComponent,
    MapComponent,
    NavigationControlDirective,
    TranslateDirective,
    GeoJSONSourceComponent,
  ],
  templateUrl: "./weather-data.component.html",
})
export class WeatherDataComponent {
  protected colorful = colorful as any as StyleSpecification;

  protected layers = {
    historical: signals.toggleable(true),
    air_temperature: signals.toggleable(true),
    moisture: signals.toggleable(true),
    precipitation: signals.toggleable(true),
    pressure: signals.toggleable(true),
    soil_temperature: signals.toggleable(true),
    solar: signals.toggleable(true),
  };
  protected stations: Signal<undefined | DwdService.V2.Stations>;

  constructor(private service: DwdService) {
    this.stations = signals.fromPromise(this.service.v2.fetchStations());
  }
}
