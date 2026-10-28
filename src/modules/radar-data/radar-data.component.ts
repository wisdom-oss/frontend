import {
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
  Component,
  Injector,
  ElementRef,
} from "@angular/core";
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
import * as turboColormap from "turbo-colormap";

import {RadarDataService} from "./radar-data.service";
import {RadarDataCursorService} from "./radar-data-cursor.service";
import {RadarDataImageSamplingService} from "./radar-data-image-sampling.service";
import {GeoDataService} from "../../api/geo-data.service";
import colorful from "../../assets/map/styles/colorful.json";
import {ResizeMapOnLoadDirective} from "../../common/directives/resize-map-on-load.directive";
import {signals} from "../../common/signals";
import {range} from "../../common/utils/range";

type TimerId = ReturnType<typeof setInterval>;

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
export class RadarDataComponent {
  // dependencies and shared data
  private injector = inject(Injector);
  protected service = inject(RadarDataService);
  protected cursor = inject(RadarDataCursorService);
  protected sampling = inject(RadarDataImageSamplingService);
  protected geoDataService = inject(GeoDataService);
  protected lang = signals.lang();
  protected manifest = this.service.fetchManifest();

  // map setup and geographic layers
  protected style = colorful as any as StyleSpecification;
  protected underzoom = new Underzoom(maplibregl);

  protected map = signals.maybe<Map>();

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

  // timelapse selection and playback
  protected timelapseDate = signals.maybe<Dayjs>();
  private timelapseIntervalId = signal<TimerId | null>(null);
  protected timelapseStatus = computed(() =>
    this.timelapseIntervalId() ? "play" : "pause",
  );

  private _initTimelapseDate = effect(() => {
    let manifest = this.manifest();
    if (!manifest) return;
    this.timelapseDate.set(manifest.start);
  });

  private _timelapseDate = effect(() =>
    console.log(this.timelapseDate()?.toISOString()),
  );

  private rasterUrl(manifest: RadarDataService.Manifest, date: Dayjs) {
    return manifest.folderPath + date.format("YYYY-MM-DDTHH:mm:ssZ") + ".png";
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
    }, 1000);
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
  private timelapsePreloaders = [new Image(), new Image()];
  private preloadTimelapseFrames(manifest: RadarDataService.Manifest) {
    let date = manifest.start;
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
