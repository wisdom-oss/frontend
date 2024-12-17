import {AsyncPipe} from "@angular/common";
import {
  AfterViewChecked,
  ViewChild,
  Component,
  OnInit,
  AfterViewInit,
  HostListener,
} from "@angular/core";
import {
  LayerComponent,
  MapComponent,
  MarkerComponent,
} from "@maplibre/ngx-maplibre-gl";
import {Point} from "geojson";
import {StyleSpecification} from "maplibre-gl";

import {GroundwaterLevelStationMarkerComponent} from "./map/groundwater-level-station-marker/groundwater-level-station-marker.component";
import {GeoDataService} from "../../api/geo-data.service";
import colorful from "../../common/map/styles/colorful.json";
import {typeUtils} from "../../common/type-utils";

type Points = typeUtils.UpdateElements<
  GeoDataService.LayerContents,
  "geometry",
  {geometry: Point}
>;

@Component({
  selector: "growl",
  imports: [
    MapComponent,
    MarkerComponent,
    GroundwaterLevelStationMarkerComponent,
    AsyncPipe,
  ],
  templateUrl: "./growl.component.html",
  styles: ``,
})
export class GrowlComponent implements OnInit {
  readonly style = colorful as any as StyleSpecification;
  @ViewChild(MapComponent) map?: MapComponent;

  readonly groundwaterMeasurementStations: Promise<Points>;

  constructor(private geo: GeoDataService) {
    this.groundwaterMeasurementStations = this.geo
      .fetchLayerContents("groundwater_measurement_stations")
      .then(contents => contents ?? [])
      .then(p => p.filter(({geometry}) => geometry.type === "Point") as Points);
  }

  ngOnInit(): void {
    this.geo
      .fetchLayerInformation("groundwater_measurement_stations")
      .then(data => console.log(data));
    this.geo
      .fetchLayerContents("groundwater_measurement_stations")
      .then(data => console.log(data));
  }

  @HostListener("window:load")
  onLoad() {
    // enforce resizing on initial load
    this.map!.mapInstance.resize();
  }
}
