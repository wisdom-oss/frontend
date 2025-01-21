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
  ControlComponent,
  LayerComponent,
  MapComponent,
  MarkerComponent,
  AttributionControlDirective,
  NavigationControlDirective,
} from "@maplibre/ngx-maplibre-gl";
import {Point} from "geojson";
import {MapLibreEvent, StyleSpecification} from "maplibre-gl";

import {GroundwaterLevelStationMarkerComponent} from "./map/groundwater-level-station-marker/groundwater-level-station-marker.component";
import {LegendControlComponent} from "./map/legend-control/legend-control.component";
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
    ControlComponent,
    NavigationControlDirective,
    AttributionControlDirective,
    GroundwaterLevelStationMarkerComponent,
    LegendControlComponent,
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
  readonly attribution = signal(`
    <a href="https://www.nlwkn.niedersachsen.de/opendata" target="_blank">
      2024 Niedersächsischer Landesbetrieb für Wasserwirtschaft, Küsten- und Naturschutz (NLWKN)
    </a>
  `);

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
    console.log(location);
  }

  onZoom(event: MapLibreEvent): void {
    let zoom = event.target.getZoom();
    let size = GrowlComponent.calculateMarkerSize(zoom);
    this.markerSize.set(size);
  }

  protected static calculateMarkerSize(zoom: number): string {
    const fp = [
      // fix points
      // zoom -> size
      [4, 15],
      [14, 50],
    ] as const;

    let a = (fp[1][1] - fp[0][1]) / (fp[1][0] - fp[0][0]);
    let b = fp[0][1] - a * fp[0][0];

    return a * zoom + b + "px";
  }
}
