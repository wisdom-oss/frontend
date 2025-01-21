import {AsyncPipe} from "@angular/common";
import {
  signal,
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
import {MapLibreEvent, StyleSpecification} from "maplibre-gl";

import {GroundwaterLevelStationMarkerComponent} from "./map/groundwater-level-station-marker/groundwater-level-station-marker.component";
import {GeoDataService} from "../../api/geo-data.service";
import {GroundwaterLevelsService} from "../../api/groundwater-levels.service";
import colorful from "../../common/map/styles/colorful.json";
import {typeUtils} from "../../common/type-utils";
import {ResizeMapOnLoadDirective} from "../../common/directives/resize-map-on-load.directive";

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
    ResizeMapOnLoadDirective,
  ],
  templateUrl: "./growl.component.html",
  styles: ``,
})
export class GrowlComponent implements OnInit {
  protected zoom = 7;
  protected markerSize = signal(GrowlComponent.calculateMarkerSize(this.zoom));
  protected style = colorful as any as StyleSpecification;

  readonly groundwaterMeasurementStations: Promise<Points>;

  constructor(
    private geo: GeoDataService,
    private gl: GroundwaterLevelsService,
  ) {
    this.groundwaterMeasurementStations = this.geo
      .fetchLayerContents("groundwater_measurement_stations")
      .then(contents => contents ?? [])
      .then(p => p.filter(({geometry}) => geometry.type === "Point") as Points);
  }

  async ngOnInit() {
    // this.geo
    //   .fetchLayerInformation("groundwater_measurement_stations")
    //   .then(data => console.log(data));
    // this.geo
    //   .fetchLayerContents("groundwater_measurement_stations")
    //   .then(data => console.log(data));
    let locations = await this.gl.fetchRecorderLocations();
    let location = await this.gl.fetchRecorderLocation(locations[0].websiteID);
    console.log(location)
  }

  onZoom(event: MapLibreEvent): void {
    let zoom = event.target.getZoom();
    let size = GrowlComponent.calculateMarkerSize(zoom);
    this.markerSize.set(size);
  }

  protected static calculateMarkerSize(zoom: number): string {
    const fixpoints = [
      // zoom -> size
      [4, 15],
      [14, 50],
    ] as const;
    let a = (fixpoints[1][1] - fixpoints[0][1]) / (fixpoints[1][0] - fixpoints[0][0]);
    let b = fixpoints[0][1] - a * fixpoints[0][0];
    
    return (a * zoom + b) + "px";
  }
}
