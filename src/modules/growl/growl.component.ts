import {
  computed,
  effect,
  signal,
  viewChild,
  Component,
  OnInit,
  Signal,
  WritableSignal,
} from "@angular/core";
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

import {GroundwaterInfoControlComponent} from "./map/groundwater-info-control/groundwater-info-control.component";
import {GroundwaterLevelStationMarkerComponent} from "./map/groundwater-level-station-marker/groundwater-level-station-marker.component";
import {LayerSelectionControlComponent} from "./map/layer-selection-control/layer-selection-control.component";
import {LegendControlComponent} from "./map/legend-control/legend-control.component";
import {StationInfoControlComponent} from "./map/station-info-control/station-info-control.component";
import {GeoDataService} from "../../api/geo-data.service";
import {GroundwaterLevelsService} from "../../api/groundwater-levels.service";
import colorful from "../../common/map/styles/colorful.json";
import {typeUtils} from "../../common/type-utils";
import {ResizeMapOnLoadDirective} from "../../common/directives/resize-map-on-load.directive";
import {signals} from "../../common/signals";

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
    AttributionControlDirective,
    ControlComponent,
    FeatureComponent,
    GeoJSONSourceComponent,
    GroundwaterInfoControlComponent,
    GroundwaterLevelStationMarkerComponent,
    LayerComponent,
    LayerSelectionControlComponent,
    LegendControlComponent,
    MapComponent,
    MarkerComponent,
    NavigationControlDirective,
    ResizeMapOnLoadDirective,
    StationInfoControlComponent,
  ],
  templateUrl: "./growl.component.html",
  styles: ``,
})
export class GrowlComponent {
  protected zoom = 7;
  protected markerSize = signal(GrowlComponent.calculateMarkerSize(this.zoom));
  protected style = colorful as any as StyleSpecification;
  protected measurementColors = LegendControlComponent.legendColors;
  protected legend = viewChild(LegendControlComponent);
  protected stationSelected = signal<string | null>(null);
  protected stationInfo = computed(() => this.findStationInfo());
  protected bodySelected = signal<number | null>(null);
  protected bodyInfo = computed(() => this.findBodyInfo());
  protected selectedLayers = {
    groundwaterLevelStations: signals.toggleable(true),
    other: signals.toggleable(false),
  } as const;

  readonly groundwaterBodies = signal<Polygons>([]);
  readonly groundwaterMeasurementStations = signal<Points>([]);
  readonly measurements: WritableSignal<
    Record<string, GroundwaterLevelsService.Measurement>
  > = signal({});
  readonly attribution = signal(`
    <a href="https://www.nlwkn.niedersachsen.de/opendata" target="_blank">
      2024 Niedersächsischer Landesbetrieb für Wasserwirtschaft, Küsten- und Naturschutz (NLWKN)
    </a>
  `);

  constructor(
    private geo: GeoDataService,
    private gl: GroundwaterLevelsService,
  ) {
    this.geo
      .fetchLayerContents("groundwater_measurement_stations")
      .then(contents => contents ?? [])
      .then(p => p.filter(({geometry}) => geometry.type === "Point") as Points)
      .then(points => this.groundwaterMeasurementStations.set(points));

    this.geo
      .fetchLayerContents("groundwater_bodies")
      .then(contents => contents ?? [])
      .then(
        p => p.filter(({geometry}) => geometry.type === "Polygon") as Polygons,
      )
      .then(polygons => this.groundwaterBodies.set(polygons));

    this.gl
      .fetchMeasurementClassifications()
      .then(data => this.measurements.set(data));

    effect(() => {
      let legend = this.legend();
      if (!legend) return;
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

  onLayerEnter(event: any) {
    console.log(event);
  }

  onZoom(event: MapLibreEvent): void {
    let zoom = event.target.getZoom();
    let size = GrowlComponent.calculateMarkerSize(zoom);
    this.markerSize.set(size);
  }

  private findStationInfo(): StationInfoControlComponent.Display | null {
    let selection = this.stationSelected();
    if (!selection) return null;

    let stations = this.groundwaterMeasurementStations();
    let station = stations.find(({key}) => selection == key);
    if (!station) return null;

    let measurements = this.measurements();
    let measurement = measurements[selection];
    if (!measurement) return null;

    return {
      name: station.name,
      station: station.key,
      date: measurement.date,
      waterLevelNHN: measurement.waterLevelNHN,
      waterLevelGOK: measurement.waterLevelGOK,
    };
  }

  private findBodyInfo(): GroundwaterInfoControlComponent.Display | null {
    let selection = this.bodySelected();
    if (!selection) return null;

    let bodies = this.groundwaterBodies();
    let body = bodies.find(({id}) => id == selection);
    if (!body) return null;

    return {
      name: body.name,
      key: body.key,
    };
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
