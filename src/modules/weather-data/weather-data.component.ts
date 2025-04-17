import {signal, Component, Signal} from "@angular/core";
import {
  ControlComponent,
  LayerComponent,
  MapComponent,
  GeoJSONSourceComponent,
  NavigationControlDirective,
} from "@maplibre/ngx-maplibre-gl";
import {TranslateDirective} from "@ngx-translate/core";
import {StyleSpecification} from "maplibre-gl";

import {DwdService} from "../../api/dwd.service";
import colorful from "../../assets/map/styles/colorful.json";
import {LayerSelectionControlComponent} from "../../common/components/map/layer-selection-control/layer-selection-control.component";
import {signals} from "../../common/signals";
import {ClusterPolygonSourceDirective} from "../../common/directives/cluster-polygon-source.directive";
import {ResizeMapOnLoadDirective} from "../../common/directives/resize-map-on-load.directive";

@Component({
  imports: [
    ControlComponent,
    GeoJSONSourceComponent,
    LayerComponent,
    LayerSelectionControlComponent,
    MapComponent,
    NavigationControlDirective,
    TranslateDirective,
    ClusterPolygonSourceDirective,
    ResizeMapOnLoadDirective,
  ],
  templateUrl: "./weather-data.component.html",
})
export class WeatherDataComponent {
  protected colorful = colorful as any as StyleSpecification;

  protected hoverStationClusterId = signal<null | number>(null);
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
