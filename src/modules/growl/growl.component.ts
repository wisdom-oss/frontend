import {Component, OnInit} from "@angular/core";
import {LayerComponent, MapComponent} from "@maplibre/ngx-maplibre-gl";
import {StyleSpecification} from "maplibre-gl";

import {GeoDataService} from "../../api/geo-data.service";
import colorful from "../../common/map/styles/colorful.json";

@Component({
  selector: "wisdom-growl",
  imports: [MapComponent, LayerComponent],
  templateUrl: "./growl.component.html",
  styles: ``,
})
export class GrowlComponent implements OnInit {
  readonly style = colorful as any as StyleSpecification;

  constructor(private geo: GeoDataService) {}

  ngOnInit(): void {
    this.geo
      .fetchLayerInformation("groundwater_measurement_stations")
      .then(data => console.log(data));
    this.geo
      .fetchLayerContents("groundwater_measurement_stations")
      .then(data => console.log(data));
  }
}
