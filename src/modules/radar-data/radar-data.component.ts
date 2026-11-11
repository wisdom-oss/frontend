import {Location} from "@angular/common";
import {
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
  Component,
  OnInit,
  Injector,
  ElementRef,
} from "@angular/core";
import {Router} from "@angular/router";
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
import dayjs, {Dayjs} from "dayjs";
import {MultiPolygon, Polygon} from "geojson";
import {Map, ImageSourceSpecification, StyleSpecification} from "maplibre-gl";
import {Underzoom} from "maplibre-xy";
import typia from "typia";

import * as maplibregl from "maplibre-gl";
import * as turboColormap from "turbo-colormap";

import {RadarDataService} from "./radar-data.service";
import {RadarDataCursorService} from "./radar-data-cursor.service";
import {RadarDataImageSamplingService} from "./radar-data-image-sampling.service";
import {GeoDataService} from "../../api/geo-data.service";
import mapStyle from "../../assets/map/styles/radar-data.json";
import {ResizeMapOnLoadDirective} from "../../common/directives/resize-map-on-load.directive";
import {signals} from "../../common/signals";
import {range} from "../../common/utils/range";

type TimerId = ReturnType<typeof setInterval>;

const TIMELAPSE_DATE_FORMAT = "YYYY-MM-DDTHH:mm:ssZ";

// TODO: The input for the datetime does not enforce the step size properly.
//       To combat this, we can get the duration between the manifest.start and
//       our selected time. The modulo of this duration and the stepsize should
//       be zero. If that is not the case, then we can round to next best
//       multiple of the stepsize that would return rest 0 of that modulo
//       calculation. This way we can calculate if a timestamp is valid without
//       calculating every timestamp in between.
//       Then apply the same correction code to the query param loading.

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
  styleUrl: "./radar-data.component.scss",
  providers: [
    RadarDataCursorService,
    RadarDataImageSamplingService,
    provideIcons({
      remixPlayLargeFill,
      remixPauseLargeFill,
      remixRewindStartFill,
    }),
  ],
  host: {
    "(document:keydown.space)": "toggleTimelapse()",
    "(document:keydown.backspace)": "rewindTimelapse()",
  },
})
export class RadarDataComponent implements OnInit {
  // dependencies and shared data
  private injector = inject(Injector);
  private location = inject(Location);
  private router = inject(Router);
  protected service = inject(RadarDataService);
  protected cursor = inject(RadarDataCursorService);
  protected sampling = inject(RadarDataImageSamplingService);
  protected geoDataService = inject(GeoDataService);
  protected lang = signals.lang();
  protected manifest = this.service.fetchManifest();

  // map setup and geographic layers
  protected underzoom = new Underzoom(maplibregl);
  protected style = mapStyle as any as StyleSpecification;

  protected map = signals.maybe<Map>();

  private _blackLabels = effect(() => {
    let map = this.map();
    if (!map) return;
    for (let layer of this.style.layers) {
      if (!layer.id.startsWith("label-")) continue;
      map.setPaintProperty(layer.id, "text-color", "#000");
      map.setLayoutProperty(layer.id, "text-font", [
        "Figtree Semibold, sans-serif",
      ]);
    }
  });

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

  private layerOrder = [
    "radar-data",
    ...this.style.layers
      .map(({id}) => id)
      .filter(id => id.startsWith("label-")),
    "lower-saxony-mask",
    "lower-saxony-mask-border",
  ];

  private sortLayers = effect(() => {
    let map = this.map();
    let lowerSaxonyMask = this.lowerSaxonyMask();
    let rasterBounds = this.rasterBounds();
    let timelapseImage = this.timelapseImage();
    if (!map || !lowerSaxonyMask || !rasterBounds || !timelapseImage) return;
    for (let layer of this.layerOrder) map.moveLayer(layer, "anchor");
    this.sortLayers.destroy;
  });

  // timelapse selection and playback
  protected timelapseDate = signals.maybe<Dayjs>();
  private timelapseIntervalId = signal<TimerId | null>(null);
  protected timelapseStatus = computed(() =>
    this.timelapseIntervalId() ? "play" : "pause",
  );

  private _initTimelapseDate = effect(() => {
    let manifest = this.manifest();
    if (!manifest || untracked(this.timelapseDate)) return;
    this.timelapseDate.set(manifest.start);
  });

  protected timelapseInput =
    viewChild.required<HTMLInputElement>("timelapseInput");

  protected timelapseInputOnChange(event: Event) {
    if (!(event.target instanceof HTMLInputElement)) return;
    let value = event.target.value.trim();
    if (!value.length) return;
    let selected = dayjs(value);

    let manifest = this.manifest();
    if (!manifest) return;

    let nearest = this.findNearestTimelapseDate(manifest, selected);
    if (!nearest) return;

    this.timelapseDate.set(nearest);
    this.preloadTimelapseFrames(manifest);
  }

  protected findNearestTimelapseDate(
    manifest: RadarDataService.Manifest,
    input: Dayjs,
  ): Dayjs | null {
    // all durations use millis here, is dayjs default

    if (input.isBefore(manifest.start)) return null;
    if (input.isAfter(manifest.end)) return null;

    let diff = Math.abs(input.diff(manifest.start));
    let stepSize = manifest.stepSize.asMilliseconds();

    let steps = Math.round(diff / stepSize);
    let durationTillValid = stepSize * steps;
    let nearest = manifest.start.add(durationTillValid);

    if (nearest.isBefore(manifest.start)) nearest = nearest.add(stepSize);
    if (nearest.isAfter(manifest.end)) nearest = nearest.subtract(stepSize);
    return nearest;
  }

  // url is only modified here, so parsing once is fine
  private timelapseUrl = this.router.parseUrl(this.location.path(true));

  ngOnInit() {
    let value = this.timelapseUrl.queryParamMap.get("date");
    if (!value) return;

    let date = dayjs(value);
    if (date.isValid()) this.timelapseDate.set(date);
  }

  private _syncTimelapseDateToUrl = effect(() => {
    if (this.timelapseStatus() != "pause") return;
    let date = this.timelapseDate();
    if (!date) return;

    this.timelapseUrl.queryParams["date"] = date.format(TIMELAPSE_DATE_FORMAT);
    this.location.replaceState(
      this.router.serializeUrl(this.timelapseUrl),
      "",
      this.location.getState(),
    );
  });

  private rasterUrl(manifest: RadarDataService.Manifest, date: Dayjs) {
    return manifest.folderPath + date.format(TIMELAPSE_DATE_FORMAT) + ".png";
  }

  protected timelapseImage = computed(() => {
    let manifest = this.manifest();
    let date = this.timelapseDate();
    if (!manifest || !date) return;
    return this.rasterUrl(manifest, date);
  });

  protected toggleTimelapse() {
    let manifest = this.manifest();
    let date = this.timelapseDate();
    if (!manifest || !date) return;

    let timelapseIntervalId = this.timelapseIntervalId();
    if (timelapseIntervalId) {
      clearInterval(timelapseIntervalId);
      this.timelapseIntervalId.set(null);
      return;
    }

    let timerId = setInterval(() => {
      let date = this.timelapseDate()!;
      this.timelapseDate.set(date.add(manifest.stepSize));
    }, 100);
    this.timelapseIntervalId.set(timerId);
  }

  protected rewindTimelapse() {
    let manifest = this.manifest();
    if (!manifest) return;

    let timelapseIntervalId = this.timelapseIntervalId();
    if (timelapseIntervalId) {
      clearInterval(timelapseIntervalId);
      this.timelapseIntervalId.set(null);
    }

    this.timelapseDate.set(manifest.start);
    this.preloadTimelapseFrames(manifest);
  }

  private _checkTimelapseEnd = effect(() => {
    let manifest = this.manifest();
    let date = this.timelapseDate();
    let intervalId = this.timelapseIntervalId();
    if (!manifest || !date || !intervalId) return;

    if (date.isBefore(manifest.end)) return;
    clearInterval(intervalId);
    this.timelapseIntervalId.set(null);
  });

  // timelapse frame preloading
  private timelapsePreloaders = Array.from({length: 20}, () => new Image());
  private preloadTimelapseFrames(manifest: RadarDataService.Manifest) {
    let date = untracked(this.timelapseDate) ?? manifest.start;
    for (let preloader of this.timelapsePreloaders) {
      preloader.src = this.rasterUrl(manifest, date);
      date = date.add(manifest.stepSize);
    }
  }

  private _preloadTimelapseFrames = effect(() => {
    let manifest = this.manifest();
    if (!manifest) return;
    this.preloadTimelapseFrames(manifest);
  });

  private _slideTimelapseFrame = effect(onCleanup => {
    let manifest = this.manifest();
    if (!manifest) return;

    let inner = untracked(() =>
      effect(
        () => {
          let date = this.timelapseDate();
          if (!date) return;
          let preloaderCount = this.timelapsePreloaders.length;
          let preloader = this.timelapsePreloaders.shift();
          if (!preloader) return;
          for (let _ in range(preloaderCount))
            date = date.add(manifest.stepSize);
          preloader.src = this.rasterUrl(manifest, date);
          this.timelapsePreloaders.push(preloader);
        },
        {injector: this.injector},
      ),
    );

    onCleanup(() => inner.destroy());
  });

  // cursor tracking and image sampling setup
  private timelapseCanvas =
    viewChild<ElementRef<HTMLCanvasElement>>("timelapseCanvas");

  constructor() {
    this.cursor.track(this.map, this.rasterBounds);
    this.sampling.connect({
      canvas: computed(() => this.timelapseCanvas()?.nativeElement),
      imageUrl: this.timelapseImage,
      pixel: this.cursor.hoveredRasterPixel,
      masked: this.cursor.hoveredMask,
      manifest: this.manifest,
    });
  }

  // cursor tooltip presentation
  protected cursorTooltip = new maplibregl.Popup({
    closeButton: false,
    closeOnClick: false,
    className: "radar-cursor-tooltip",
    anchor: "left",
    offset: [12, 0],
  });
  private cursorTooltipContent = viewChild<ElementRef<HTMLDivElement>>(
    "cursorTooltipContent",
  );
  protected cursorTooltipText = computed(() => {
    const value = this.sampling.hoveredRasterValue();
    const manifest = this.manifest();
    return value === null || !manifest
      ? ""
      : `≈ ${Math.floor(value)} ${manifest.unit}`;
  });

  private _attachCursorTooltip = effect(onCleanup => {
    let map = this.map();
    if (!map) return;
    onCleanup(() => this.cursorTooltip.remove());
  });

  private _updateCursorTooltipPosition = effect(() => {
    const position = this.cursor.cursorLngLat();
    if (position) this.cursorTooltip.setLngLat(position);
  });

  private _updateCursorTooltipValue = effect(() => {
    const map = this.map();
    const value = this.sampling.hoveredRasterValue();
    const manifest = this.manifest();
    const content = this.cursorTooltipContent();
    if (!map || value === null || !manifest || !content) {
      this.cursorTooltip.remove();
      return;
    }

    this.cursorTooltip.setDOMContent(content.nativeElement);
    if (!this.cursorTooltip.isOpen()) this.cursorTooltip.addTo(map);
  });

  // color scale legend
  protected turboGradient = `linear-gradient(to top, ${turboColormap.rgbColormap
    .map(([r, g, b]) => `rgb(${r}, ${g}, ${b})`)
    .join(", ")})`;

  protected legendValues = computed(() => {
    const manifest = this.manifest();
    if (!manifest) return [];

    const steps = 8;
    const stepSize = (manifest.max - manifest.min) / (steps - 1);
    return Array.from({length: steps}, (_, i) =>
      Math.floor(manifest.max - i * stepSize),
    );
  });
}
