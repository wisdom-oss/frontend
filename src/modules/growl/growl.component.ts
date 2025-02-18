import {NgIf, KeyValuePipe} from "@angular/common";
import {effect, signal, Component} from "@angular/core";
import {
  ControlComponent,
  ImageComponent,
  LayerComponent,
  MapComponent,
  GeoJSONSourceComponent,
  AttributionControlDirective,
  NavigationControlDirective,
} from "@maplibre/ngx-maplibre-gl";
import {StyleSpecification} from "maplibre-gl";

import {DisplayInfoControlComponent} from "./map/display-info-control/display-info-control.component";
import {LayerSelectionControlComponent} from "./map/layer-selection-control/layer-selection-control.component";
import {LegendControlComponent} from "./map/legend-control/legend-control.component";
import {GrowlService} from "./growl.service";
import nlwknMeasurementClassificationColors from "../../assets/nlwkn-measurement-classification-colors.toml";
import colorful from "../../assets/map/styles/colorful.json";
import {ResizeMapOnLoadDirective} from "../../common/directives/resize-map-on-load.directive";
import {signals} from "../../common/signals";

@Component({
  selector: "growl",
  imports: [
    AttributionControlDirective,
    ControlComponent,
    DisplayInfoControlComponent,
    GeoJSONSourceComponent,
    ImageComponent,
    KeyValuePipe,
    LayerComponent,
    LayerSelectionControlComponent,
    LegendControlComponent,
    MapComponent,
    NavigationControlDirective,
    NgIf,
    ResizeMapOnLoadDirective,
  ],
  templateUrl: "./growl.component.html",
  styles: ``,
})
export class GrowlComponent {
  protected style = colorful as any as StyleSpecification;
  protected measurementColors = nlwknMeasurementClassificationColors;

  // prettier-ignore
  protected hoveredFeatures = {
    groundwaterMeasurementStation: signal<GroundwaterMeasurementStationFeature | null>(null),
    groundwaterBody: signal<GroundwaterBodyFeature | null>(null),
    ndsMunicipal: signal<NdsMunicipalFeature | null>(null),
  }

  protected selectedLayers = {
    waterRightUsageLocations: signals.toggleable(false),
    oldWaterRightUsageLocations: signals.toggleable(false),
    groundwaterLevelStations: signals.toggleable(true),
    ndsMunicipals: signals.toggleable(false),
    groundwaterBodies: signals.toggleable(true),
  } as const;
  protected selectedLayersUpdate = signal(false);

  readonly attribution = signal(`
    <a href="https://www.nlwkn.niedersachsen.de/opendata" target="_blank">
      2024 Niedersächsischer Landesbetrieb für Wasserwirtschaft, Küsten- und Naturschutz (NLWKN)
    </a>
  `);

  constructor(protected service: GrowlService) {
    effect(() => {
      // force layer order by redrawing them on every update
      for (let s of Object.values(service.data)) s();
      for (let s of Object.values(this.selectedLayers)) s();
      this.selectedLayersUpdate.set(false);
      setTimeout(() => this.selectedLayersUpdate.set(true));
    });
  }

  protected displayGroundwaterMeasurementStation(
    feature: GroundwaterMeasurementStationFeature | null,
  ): DisplayInfoControlComponent.Data | null {
    if (!feature) return null;
    return {
      title: feature.properties.name,
      table: {
        station: feature.properties.station,
        date: feature.properties.date,
        waterLevelNHN: feature.properties.waterLevelNHN,
        waterLevelGOK: feature.properties.waterLevelGOK,
      },
    };
  }

  protected displayGroundwaterBody(
    feature: GroundwaterBodyFeature | null,
  ): DisplayInfoControlComponent.Data | null {
    if (!feature) return null;
    return {
      title: feature.properties.name,
      subtitle: feature.properties.key,
    };
  }

  protected displayNdsMunicipal(
    feature: NdsMunicipalFeature | null,
  ): DisplayInfoControlComponent.Data | null {
    if (!feature) return null;
    return {
      title: feature.properties.name,
      subtitle: feature.properties.key,
    };
  }
}

type GroundwaterMeasurementStationFeature =
  GrowlService.GroundwaterMeasurementStations["features"][0];
type GroundwaterBodyFeature = GrowlService.GroundwaterBodies["features"][0];
type NdsMunicipalFeature = GrowlService.NdsMunicipals["features"][0];
