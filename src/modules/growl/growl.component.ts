import {AsyncPipe} from "@angular/common";
import {signal, Component, OnInit, Signal, WritableSignal, viewChild, effect} from "@angular/core";
import {
  ControlComponent,
  FeatureComponent,
  LayerComponent,
  MapComponent,
  MarkerComponent,
  GeoJSONSourceComponent,
  AttributionControlDirective,
  NavigationControlDirective,
} from "@maplibre/ngx-maplibre-gl";
import {Point, Polygon} from "geojson";
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

type Polygons = typeUtils.UpdateElements<
  GeoDataService.LayerContents,
  "geometry",
  {geometry: Polygon}
>;

@Component({
  selector: "growl",
  imports: [
    AsyncPipe,
    AttributionControlDirective,
    ControlComponent,
    FeatureComponent,
    GeoJSONSourceComponent,
    GroundwaterLevelStationMarkerComponent,
    LayerComponent,
    LegendControlComponent,
    MapComponent,
    MarkerComponent,
    NavigationControlDirective,
    ResizeMapOnLoadDirective,
  ],
  templateUrl: "./growl.component.html",
  styles: ``,
})
export class GrowlComponent implements OnInit {
  protected zoom = 7;
  protected markerSize = signal(GrowlComponent.calculateMarkerSize(this.zoom));
  protected style = colorful as any as StyleSpecification;
  protected measurementColors = LegendControlComponent.legendColors;
  protected legend = viewChild.required(LegendControlComponent);

  readonly groundwaterBodies: Promise<Polygons>;
  readonly groundwaterMeasurementStations: Promise<Points>;
  readonly measurements: WritableSignal<Record<string, GroundwaterLevelsService.Measurement>> = signal({});
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

    this.groundwaterBodies = this.geo
      .fetchLayerContents("groundwater_bodies")
      .then(contents => contents ?? [])
      .then(
        p => p.filter(({geometry}) => geometry.type === "Polygon") as Polygons,
      );

    this.gl.fetchMeasurementClassifications().then(data => this.measurements.set(data));

    effect(() => {
      let legend = this.legend();
      let measurements = this.measurements();
      
      const MC = GroundwaterLevelsService.MeasurementClassification;
      let count = {
        [MC.MAX_EXCEEDED]: 0,
        [MC.VERY_HIGH]: 0,
        [MC.HIGH]: 0,
        [MC.NORMAL]: 0,
        [MC.LOW]: 0,
        [MC.VERY_LOW]: 0,
        [MC.MIN_UNDERSHOT]: 0,
        null: 0,
      };

      for (let {classification} of Object.values(measurements)) {
        count[classification || "null"]++;
      }

      legend.count.set(count);
    });
  }

  async ngOnInit() {
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
