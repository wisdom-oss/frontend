import {computed, effect, inject, signal, Component} from "@angular/core";
import {
  ControlComponent,
  LayerComponent,
  MapComponent,
  ImageSourceComponent,
  GeoJSONSourceComponent,
  NavigationControlDirective,
} from "@maplibre/ngx-maplibre-gl";
import {provideIcons, NgIconComponent} from "@ng-icons/core";
import {
  remixPauseLargeFill,
  remixPlayLargeFill,
  remixRewindStartFill,
} from "@ng-icons/remixicon";
import {mask} from "@turf/turf";
import {Dayjs} from "dayjs";
import {MultiPolygon, Polygon} from "geojson";
import {Map, ImageSourceSpecification, StyleSpecification} from "maplibre-gl";
import {Underzoom} from "maplibre-xy";
import typia from "typia";

import * as maplibregl from "maplibre-gl";

import {RadarDataService} from "./radar-data.service";
import {GeoDataService} from "../../api/geo-data.service";
import colorful from "../../assets/map/styles/colorful.json";
import {ResizeMapOnLoadDirective} from "../../common/directives/resize-map-on-load.directive";
import {signals} from "../../common/signals";

type TimerId = ReturnType<typeof setInterval>;

// TODO:
// - provide legend

@Component({
  imports: [
    ControlComponent,
    GeoJSONSourceComponent,
    ImageSourceComponent,
    LayerComponent,
    MapComponent,
    NavigationControlDirective,
    ResizeMapOnLoadDirective,
    NgIconComponent,
  ],
  templateUrl: "./radar-data.component.html",
  providers: [
    provideIcons({
      remixPlayLargeFill,
      remixPauseLargeFill,
      remixRewindStartFill,
    }),
  ],
  host: {
    "(document:keydown.space)": "toggleTimeLapse()",
    "(document:keydown.backspace)": "rewindTimeLapse()",
  },
})
export class RadarDataComponent {
  protected service = inject(RadarDataService);
  protected geoDataService = inject(GeoDataService);
  protected lang = signals.lang();

  protected style = colorful as any as StyleSpecification;
  protected underzoom = new Underzoom(maplibregl);

  protected map = signals.maybe<Map>();

  protected manifest = this.service.fetchManifest();
  protected rasterBounds = computed<
    ImageSourceSpecification["coordinates"] | undefined
  >(() => {
    const bbox = this.manifest()?.bbox;
    if (!bbox) return undefined;

    const [west, south, east, north] = bbox;
    return [
      [west, north],
      [east, north],
      [east, south],
      [west, south],
    ];
  });

  private _fitMap = effect(() => {
    let manifest = this.manifest();
    let map = this.map();
    if (!manifest || !map) return;
    map.fitBounds(manifest.bbox);
    map.setTransformConstrain(this.underzoom.transformConstrain);
    map.setMaxBounds(manifest.bbox);
  });

  protected timeLapseDate = signals.maybe<Dayjs>();
  protected timeLapseStatus = computed(() =>
    this.timeLapseIntervalId() ? "play" : "pause",
  );

  private _initTimeLapseDate = effect(() => {
    let manifest = this.manifest();
    if (!manifest) return;
    this.timeLapseDate.set(manifest.start);
  });

  private _timeLapseDate = effect(() =>
    console.log(this.timeLapseDate()?.toISOString()),
  );

  private timeLapseImage = computed(() => {
    let manifest = this.manifest();
    let date = this.timeLapseDate();
    if (!manifest || !date) return;
    return manifest.folderPath + date.format("YYYY-MM-DDTHH:mm:ssZ") + ".png";
  });

  private timeLapseIntervalId = signal<TimerId | null>(null);
  protected toggleTimeLapse() {
    let manifest = this.manifest();
    let date = this.timeLapseDate();
    if (!manifest || !date) return;

    let timeLapseIntervalId = this.timeLapseIntervalId();
    if (timeLapseIntervalId) {
      clearInterval(timeLapseIntervalId);
      this.timeLapseIntervalId.set(null);
      return;
    }

    let timerId = setInterval(() => {
      let date = this.timeLapseDate()!;
      this.timeLapseDate.set(date.add(manifest.stepSize));
    }, 1000);
    this.timeLapseIntervalId.set(timerId);
  }

  protected rewindTimeLapse() {
    let manifest = this.manifest();
    if (!manifest) return;

    let timeLapseIntervalId = this.timeLapseIntervalId();
    if (timeLapseIntervalId) {
      clearInterval(timeLapseIntervalId);
      this.timeLapseIntervalId.set(null);
    }

    this.timeLapseDate.set(manifest.start);
  }

  private _checkTimeLapseEnd = effect(() => {
    let manifest = this.manifest();
    let date = this.timeLapseDate();
    let intervalId = this.timeLapseIntervalId();
    if (!manifest || !date || !intervalId) return;

    if (date.isBefore(manifest.end)) return;
    clearInterval(intervalId);
    this.timeLapseIntervalId.set(null);
  });

  protected states = this.geoDataService.fetchLayerContents("states");
  protected lowerSaxonyMask = computed(() => {
    let states = this.states();
    if (!states) return;

    // "03" is the key for Lower Saxony, officially defined
    let layerContent = states.data.find(shape => shape.key == "03");
    if (!layerContent) throw new Error("could not find Lower Saxony shape");
    let polygon = typia.assert<Polygon | MultiPolygon>(layerContent.geometry);

    return mask(polygon);
  });
}
