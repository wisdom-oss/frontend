import {NgIf, DatePipe, KeyValuePipe} from "@angular/common";
import {computed, effect, signal, Component, Signal} from "@angular/core";
import {
  ControlComponent,
  ImageComponent,
  LayerComponent,
  MapComponent,
  GeoJSONSourceComponent,
  AttributionControlDirective,
  NavigationControlDirective,
} from "@maplibre/ngx-maplibre-gl";
import dayjs from "dayjs";
import {StyleSpecification} from "maplibre-gl";

import {DisplayInfoControlComponent} from "./map/display-info-control/display-info-control.component";
import {LayerSelectionControlComponent} from "./map/layer-selection-control/layer-selection-control.component";
import {LegendControlComponent} from "./map/legend-control/legend-control.component";
import {GrowlService} from "./growl.service";
import {WithdrawalInfoControlComponent} from "./map/withdrawal-info-control/withdrawal-info-control.component";
import {WaterRightsServiceService} from "../../api/water-rights-service.service";
import nlwknMeasurementClassificationColors from "../../assets/nlwkn-measurement-classification-colors.toml";
import colorful from "../../assets/map/styles/colorful.json";
import {ResizeMapOnLoadDirective} from "../../common/directives/resize-map-on-load.directive";
import {signals} from "../../common/signals";

@Component({
  selector: "growl",
  imports: [
    AttributionControlDirective,
    ControlComponent,
    DatePipe,
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
    WithdrawalInfoControlComponent,
  ],
  templateUrl: "./growl.component.html",
  styles: ``,
})
export class GrowlComponent {
  protected style = colorful as any as StyleSpecification;
  protected measurementColors = nlwknMeasurementClassificationColors;

  readonly attribution = signal(`
    <a href="https://www.nlwkn.niedersachsen.de/opendata" target="_blank">
      2024 Niedersächsischer Landesbetrieb für Wasserwirtschaft, Küsten- und Naturschutz (NLWKN)
    </a>
  `);

  // prettier-ignore
  protected hoveredFeatures = {
    groundwaterMeasurementStation: signal<GroundwaterMeasurementStationFeature | null>(null),
    groundwaterBody: signal<GroundwaterBodyFeature | null>(null),
    ndsMunicipal: signal<NdsMunicipalFeature | null>(null),
  };

  protected selectedLayers = {
    waterRightUsageLocations: signals.toggleable(false),
    oldWaterRightUsageLocations: signals.toggleable(false),
    groundwaterLevelStations: signals.toggleable(true),
    ndsMunicipals: signals.toggleable(false),
    groundwaterBodies: signals.toggleable(true),
  } as const;
  protected selectedLayersUpdate = signal(false);

  protected averageWithdrawals = signal<{
    name: string;
    key: string;
    withdrawals: Signal<WaterRightsServiceService.AverageWithdrawals | null>;
  } | null>(null);

  protected lang = signals.lang();
  private initialLoad = computed(() => {
    return (
      !!this.service.data.groundwaterMeasurementStations().features.length &&
      !!this.service.data.groundwaterBodies().features.length
    );
  });

  constructor(
    protected service: GrowlService,
    private waterRightsService: WaterRightsServiceService,
  ) {
    effect(() => {
      // force layer order by redrawing them on every update
      this.initialLoad();
      for (let s of Object.values(this.selectedLayers)) s();
      this.selectedLayersUpdate.set(false);
      setTimeout(() => this.selectedLayersUpdate.set(true));
    });
  }

  protected displayGroundwaterMeasurementStation(
    feature: GroundwaterMeasurementStationFeature | null,
  ): DisplayInfoControlComponent.Data | null {
    if (!feature) return null;
    let date = feature.properties.date;
    return {
      title: feature.properties.name,
      table: {
        station: feature.properties.station,
        date: date ? dayjs(date) : undefined,
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

  protected selectMeasurementDay(value: 0 | 1 | 2 | 3 | 4 | 5 | 6) {
    this.service.selectMeasurementsDay.set(value);
  }

  protected updateAverageWithdrawals(
    groundwaterBody: GroundwaterBodyFeature | null,
  ) {
    for (let body of this.service.data.groundwaterBodies().features) {
      if (groundwaterBody?.id == body.id) {
        let withdrawalData = {
          name: body.properties.name ?? body.properties.key,
          key: body.properties.key,
          withdrawals:
            signal<WaterRightsServiceService.AverageWithdrawals | null>(null),
        };

        this.waterRightsService
          .fetchAverageWithdrawals(body.geometry)
          .then(data => withdrawalData.withdrawals.set(data));

        this.averageWithdrawals.set(withdrawalData);
        return;
      }
    }

    return this.averageWithdrawals.set(null);
  }
}

type GroundwaterMeasurementStationFeature =
  GrowlService.GroundwaterMeasurementStations["features"][0];
type GroundwaterBodyFeature = GrowlService.GroundwaterBodies["features"][0];
type NdsMunicipalFeature = GrowlService.NdsMunicipals["features"][0];
