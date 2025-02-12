import {
  computed,
  effect,
  signal,
  viewChild,
  Component,
  WritableSignal,
} from "@angular/core";
import {
  ControlComponent,
  LayerComponent,
  MapComponent,
  MarkerComponent,
  GeoJSONSourceComponent,
  AttributionControlDirective,
  NavigationControlDirective,
} from "@maplibre/ngx-maplibre-gl";
import {
  FeatureCollection,
  Feature,
  Geometry,
  Point,
  MultiPolygon,
  Polygon,
} from "geojson";
import {MapLibreEvent, StyleSpecification} from "maplibre-gl";

import {DisplayInfoControlComponent} from "./map/display-info-control/display-info-control.component";
import {GroundwaterLevelStationMarkerComponent} from "./map/groundwater-level-station-marker/groundwater-level-station-marker.component";
import {LayerSelectionControlComponent} from "./map/layer-selection-control/layer-selection-control.component";
import {LegendControlComponent} from "./map/legend-control/legend-control.component";
import {GeoDataService} from "../../api/geo-data.service";
import {GroundwaterLevelsService} from "../../api/groundwater-levels.service";
import {ResizeMapOnLoadDirective} from "../../common/directives/resize-map-on-load.directive";
import colorful from "../../common/map/styles/colorful.json";
import {signals} from "../../common/signals";

type GeoProperties = {name?: string | null; key: string; [key: string]: any};
type Points = FeatureCollection<Point, GeoProperties>;
type Polygons = FeatureCollection<Polygon, GeoProperties>;
type MultiPolygons = FeatureCollection<MultiPolygon, GeoProperties>;
function emptyFeatures<G extends Geometry>(): FeatureCollection<
  G,
  GeoProperties
> {
  return {
    type: "FeatureCollection",
    features: [],
  };
}

@Component({
  selector: "growl",
  imports: [
    AttributionControlDirective,
    ControlComponent,
    GeoJSONSourceComponent,
    GroundwaterLevelStationMarkerComponent,
    LayerComponent,
    LayerSelectionControlComponent,
    LegendControlComponent,
    MapComponent,
    MarkerComponent,
    NavigationControlDirective,
    ResizeMapOnLoadDirective,
    DisplayInfoControlComponent,
  ],
  templateUrl: "./growl.component.html",
  styles: ``,
})
export class GrowlComponent {
  protected zoom = 6.8;
  protected markerSize = signal(GrowlComponent.calculateMarkerSize(this.zoom));
  protected style = colorful as any as StyleSpecification;
  protected measurementColors = LegendControlComponent.legendColors;
  protected legend = viewChild(LegendControlComponent);
  protected stationSelected = signal<string | null>(null);
  protected stationInfo = computed(() => this.findStationInfo());
  protected bodySelected = signal<number | null>(null);
  protected bodyInfo = computed(() => this.findBodyInfo());
  protected municipalSelected = signal<number | null>(null);
  protected municipalInfo = computed(() => this.findMunicipalInfo());

  protected selectedLayers = {
    waterRightUsageLocations: signals.toggleable(false),
    oldWaterRightUsageLocations: signals.toggleable(false),
    groundwaterLevelStations: signals.toggleable(true),
    ndsMunicipals: signals.toggleable(false),
    groundwaterBodies: signals.toggleable(true),
  } as const;

  readonly groundwaterBodies = signal<Polygons>(emptyFeatures());
  readonly groundwaterMeasurementStations = signal<Points>(emptyFeatures());
  readonly ndsMunicipals = signal<MultiPolygons>(emptyFeatures());
  readonly waterRightUsageLocations = signal<Points>(emptyFeatures());
  readonly oldWaterRightUsageLocations = signal<Points>(emptyFeatures());
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
    this.fetchGeoData(
      "groundwater_measurement_stations",
      "Point",
      this.groundwaterMeasurementStations.set,
    );
    this.fetchGeoData(
      "groundwater_bodies",
      "Polygon",
      this.groundwaterBodies.set,
    );
    this.fetchGeoData("nds_municipals", "MultiPolygon", this.ndsMunicipals.set);
    this.fetchGeoData(
      "water_right_usage_locations",
      "Point",
      this.waterRightUsageLocations.set,
    );
    this.fetchGeoData(
      "old_water_right_usage_locations",
      "Point",
      this.oldWaterRightUsageLocations.set,
    );

    this.gl
      .fetchMeasurementClassifications()
      .then(data => this.measurements.set(data));

    effect(() => {
      console.log(this.waterRightUsageLocations());
    });

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

  private async fetchGeoData<G extends Geometry>(
    layerName: string,
    type: G["type"],
    setter: (data: FeatureCollection<G, GeoProperties>) => void,
  ) {
    let contents = (await this.geo.fetchLayerContents(layerName)) ?? [];
    let elements = contents.filter(({geometry}) => geometry.type == type);
    let features: Feature<G, GeoProperties>[] = elements.map(element => ({
      type: "Feature",
      geometry: element.geometry as G,
      id: element.id,
      properties: {
        name: element.name,
        key: element.key,
        ...element.additionalProperties,
      },
    }));

    let featureCollection: FeatureCollection<G, GeoProperties> = {
      type: "FeatureCollection",
      features,
    };

    setter(featureCollection);
  }

  private findStationInfo(): DisplayInfoControlComponent.Data | null {
    let selection = this.stationSelected();
    if (!selection) return null;

    let stations = this.groundwaterMeasurementStations();
    let station = stations.features.find(({id}) => selection == id);
    if (!station) return null;

    let measurements = this.measurements();
    let measurement = measurements[selection];
    if (!measurement) return null;

    return {
      title: station.properties.name,
      table: {
        station: station.properties.key,
        date: measurement.date,
        waterLevelNHN: measurement.waterLevelNHN,
        waterLevelGOK: measurement.waterLevelGOK,
      },
    };
  }

  private findBodyInfo(): DisplayInfoControlComponent.Data | null {
    let selection = this.bodySelected();
    if (!selection) return null;

    let bodies = this.groundwaterBodies();
    let body = bodies.features.find(({id}) => id == selection);
    if (!body) return null;

    return {
      title: body.properties.name,
      subtitle: body.properties.key,
    };
  }

  private findMunicipalInfo(): DisplayInfoControlComponent.Data | null {
    let selection = this.municipalSelected();
    if (!selection) return null;

    let municipals = this.ndsMunicipals();
    let municipal = municipals.features.find(({id}) => id == selection);
    if (!municipal) return null;

    return {
      title: municipal.properties.name,
      subtitle: municipal.properties.key,
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
