import {KeyValuePipe, DOCUMENT} from "@angular/common";
import {
  computed,
  effect,
  inject,
  model,
  signal,
  untracked,
  viewChild,
  Component,
  ElementRef,
  Signal,
  WritableSignal,
} from "@angular/core";
import {FormsModule} from "@angular/forms";
import {ActivatedRoute, Router} from "@angular/router";
import {
  ControlComponent,
  LayerComponent,
  MapComponent,
  GeoJSONSourceComponent,
  NavigationControlDirective,
} from "@maplibre/ngx-maplibre-gl";
import {provideIcons, NgIconComponent} from "@ng-icons/core";
import {remixLoader4Fill} from "@ng-icons/remixicon";
import {TranslateDirective, TranslatePipe} from "@ngx-translate/core";
import dayjs from "dayjs";
import {BBox} from "geojson";
import {StyleSpecification} from "maplibre-gl";

import * as turf from "@turf/turf";

import {DwdService} from "../../api/dwd.service";
import colorful from "../../assets/map/styles/colorful.json";
import {LayerSelectionControlComponent} from "../../common/components/map/layer-selection-control/layer-selection-control.component";
import {signals} from "../../common/signals";
import {ClusterPolygonSourceDirective} from "../../common/directives/cluster-polygon-source.directive";
import {ResizeMapOnLoadDirective} from "../../common/directives/resize-map-on-load.directive";
import {ResizeObserverDirective} from "../../common/directives/resize-observer.directive";
import {MapCursorDirective} from "../../common/directives/map-cursor.directive";
import {cast} from "../../common/utils/cast";
import {typeUtils} from "../../common/utils/type-utils";

type Stations = DwdService.V2.Stations;
type DownloadParams = DwdService.Params.V1.Data;

const MAPPING = {
  product: {
    cloudType: "cloud_type",
    morePrecipitation: "more_precip",
    precipitation: "precipitation",
    moreWeatherPhenomena: "more_weather_phenomena",
    waterEquivalent: "water_equiv",
    airTemperature: "air_temperature",
    cloudiness: "cloudiness",
    dewPoint: "dew_point",
    extremeTemperatures: "extreme_temperature",
    moisture: "moisture",
    soil: "soil",
    visibility: "visibility",
    weatherPhenomena: "weather_phenomena",
    windSpeeds: "wind",
    extremeWinds: "extreme_wind",
    pressure: "pressure",
    soilTemperature: "soil_temperature",
    solarRadiation: "solar",
    sun: "sun",
    windSynopsis: "wind_synop",
  },
  resolution: {
    everyMinute: "1_minute",
    every5Minutes: "5_minutes",
    every10Minutes: "10_minutes",
    hourly: "hourly",
    subDaily: "subdaily",
    daily: "daily",
    monthly: "monthly",
    annual: "annual",
  },
} as const;

@Component({
  imports: [
    ClusterPolygonSourceDirective,
    ControlComponent,
    GeoJSONSourceComponent,
    KeyValuePipe,
    LayerComponent,
    LayerSelectionControlComponent,
    MapComponent,
    MapCursorDirective,
    NavigationControlDirective,
    ResizeMapOnLoadDirective,
    ResizeObserverDirective,
    TranslateDirective,
    FormsModule,
    NgIconComponent,
    TranslatePipe,
  ],
  templateUrl: "./weather-data.component.html",
  styleUrl: "./weather-data.component.scss",
  providers: [
    provideIcons({
      remixLoader4Fill,
    }),
  ],
})
export class WeatherDataComponent {
  private service = inject(DwdService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  protected lang = signals.lang();
  protected document = inject(DOCUMENT);
  private selectDiv = viewChild<ElementRef<HTMLDivElement>>("select");
  protected selectDivWidth = signal(0);
  private downloadAnchor =
    viewChild.required<ElementRef<HTMLAnchorElement>>("downloadAnchor");

  protected colorful = colorful as any as StyleSpecification;
  protected clusterPolygonSource = viewChild.required(
    ClusterPolygonSourceDirective,
  );

  protected layout = signal<"row" | "column">("row");
  protected cursor = computed(() =>
    this.hoverStationId() || this.hoverStationClusterId() ? "pointer" : "grab",
  );

  protected fitBounds = signal<BBox | undefined>(undefined);
  protected hoverStationId = signal<undefined | string>(undefined);
  protected hoverStationClusterId = signal<undefined | number>(undefined);
  protected stations: Signal<undefined | Stations>;
  protected filteredStations = computed(() => this.filterStations());
  protected layers = computed(() => this.determineLayers());

  protected selectedStationId = signal<undefined | string>(undefined);
  protected selectedStation = computed(() => {
    let stations = this.stations();
    let stationId = this.selectedStationId();
    if (!stations || !stationId) return undefined;
    return stations.features.find(
      feature => feature.properties.id == stationId,
    );
  });

  protected stationInfo = this.service.v1.fetchStation(this.selectedStationId);

  protected selectedProduct = signal<
    undefined | keyof (typeof MAPPING)["product"]
  >(undefined);
  protected selectedResolution = signal<
    undefined | keyof (typeof MAPPING)["resolution"]
  >(undefined);

  protected productInfo = computed(() => {
    let info = this.stationInfo();
    let product = this.selectedProduct();
    let resolution = this.selectedResolution();
    if (!info || !product || !resolution) return;

    let mappedProduct = MAPPING.product[product];
    let mappedResolution = MAPPING.resolution[resolution];
    return info.capabilities.find(
      capability =>
        capability.dataType == mappedProduct &&
        capability.resolution == mappedResolution,
    );
  });

  protected productAvailableFrom = signals.dayjs(
    () => this.productInfo()?.availableFrom,
  );
  protected productAvailableUntil = signals.dayjs(
    () => this.productInfo()?.availableUntil,
  );

  protected productFromRaw = model<any>();
  protected productUntilRaw = model<any>();
  protected productFrom = signals.dayjs(() => this.productFromRaw());
  protected productUntil = signals.dayjs(() => this.productUntilRaw());

  private downloadParams = signals.maybe<DownloadParams>();
  private downloadResource = this.service.v1.fetchData(this.downloadParams);
  protected downloading = signal(false);

  protected util = {
    cast,
    log: (...args: any[]) => console.log(...args),
  };

  constructor() {
    this.selectedStationId.set(this.route.snapshot.queryParams["station"]);
    effect(() =>
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {station: this.selectedStationId()},
      }),
    );

    this.stations = this.service.v2.fetchStations();

    effect(() => {
      let selected = this.selectedStation();
      if (!selected) return;

      // only update bounds if select div is rendered
      let selectDiv = this.selectDiv();
      let selectDivWidth = this.selectDivWidth();
      if (!selectDiv || !selectDivWidth) return;

      let bbox = turf.bbox(selected.geometry);
      let padding = 0.01;
      bbox[0] -= padding;
      bbox[1] -= padding;
      bbox[2] += padding;
      bbox[3] += padding;

      // update map after selector appeared
      setTimeout(() => this.fitBounds.set(bbox));
    });

    effect(() => {
      // reset product when switching stations
      this.selectedStation();
      this.selectedProduct.set(undefined);
    });

    effect(() => {
      // reset resolution when switching product
      this.selectedProduct();
      this.selectedResolution.set(undefined);
    });
  }

  protected onColumnsResize([entry]: ResizeObserverEntry[]): void {
    let width = entry.borderBoxSize[0].inlineSize;
    this.layout.set(width < 700 ? "column" : "row");
  }

  protected async download(options: {
    stationId: string;
    product: (typeof MAPPING)["product"][keyof (typeof MAPPING)["product"]];
    resolution: (typeof MAPPING)["resolution"][keyof (typeof MAPPING)["resolution"]];
    from: dayjs.Dayjs;
    until: dayjs.Dayjs;
  }): Promise<void> {
    this.downloading.set(true);

    let {stationId, product, resolution, from, until} = options;
    this.downloadParams.set({
      stationId,
      dataType: product,
      granularity: resolution,
      from,
      until,
    });
  }

  private downloadedEffect = effect(() => {
    let data = this.downloadResource();
    if (!data) return;
    let blob = new Blob([JSON.stringify(data)], {type: "application/json"});
    let url = URL.createObjectURL(blob);

    let a = this.downloadAnchor().nativeElement;
    a.href = url;
    let {dataType: product, granularity: resolution} = untracked(
      this.downloadParams,
    )!;
    a.download = `WISdoM_Weather_Data_${this.stationInfo()!.name}_${product}_${resolution}.json`;
    a.click();

    this.downloading.set(false);
  });

  private determineLayers(): Record<
    string,
    signals.ToggleableSignal<WritableSignal<boolean>>
  > {
    let properties = new Set<string>();
    for (let feature of this.stations()?.features ?? []) {
      for (let property in feature.properties.products)
        properties.add(property);
    }

    return Object.fromEntries(
      Array.from(properties.values()).map(key => [
        key,
        signals.toggleable(true),
      ]),
    );
  }

  private filterStations(): Stations {
    let empty: Stations = {
      type: "FeatureCollection",
      features: [],
    };

    let stations = this.stations();
    if (!stations) return empty;

    let layers = this.layers();
    let activeLayers = new Set<string>();
    for (let [layer, signal] of Object.entries(layers)) {
      if (signal()) activeLayers.add(layer);
    }

    let features = stations.features.filter(feature => {
      let productKeys = Object.keys(feature.properties.products);
      if (productKeys.length < activeLayers.size) return false;

      let products = new Set(productKeys);
      for (let layer of activeLayers) {
        if (!products.has(layer)) return false;
      }

      return true;
    });

    return {type: "FeatureCollection", features};
  }
}
