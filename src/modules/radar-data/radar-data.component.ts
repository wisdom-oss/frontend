import {
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
  Component,
  ElementRef,
  Injector,
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
import {
  MercatorCoordinate,
  MapMouseEvent,
  Map,
  ImageSource,
  ImageSourceSpecification,
  StyleSpecification,
} from "maplibre-gl";
import {Underzoom} from "maplibre-xy";
import typia from "typia";

import * as maplibregl from "maplibre-gl";
import * as turboColormap from "turbo-colormap";

import {RadarDataService} from "./radar-data.service";
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
  private injector = inject(Injector);
  protected service = inject(RadarDataService);
  protected geoDataService = inject(GeoDataService);
  protected lang = signals.lang();

  protected style = colorful as any as StyleSpecification;
  protected underzoom = new Underzoom(maplibregl);

  protected map = signals.maybe<Map>();

  protected hoveredRasterPixel = signal<{x: number; y: number} | null>(null);
  protected hoveredMask = signal(false);
  protected cursorLngLat = signal<maplibregl.LngLat | null>(null);

  protected hoveredRasterRgb = computed<{
    r: number;
    g: number;
    b: number;
  } | null>(() => {
    const pixel = this.hoveredRasterPixel();
    const frame = this.loadedTimelapseFrame();
    const context = this.timelapseContext();
    if (
      this.hoveredMask() ||
      !pixel ||
      !frame ||
      frame !== this.timelapseImage() ||
      !context
    )
      return null;

    const {width, height} = context.canvas;
    if (pixel.x < 0 || pixel.x >= width || pixel.y < 0 || pixel.y >= height)
      return null;

    const {data} = context.getImageData(pixel.x, pixel.y, 1, 1);
    if (data[3] === 0) return null;
    return {r: data[0], g: data[1], b: data[2]};
  });

  protected hoveredRasterValue = computed<number | null>(() => {
    const rgb = this.hoveredRasterRgb();
    const manifest = this.manifest();
    if (!rgb || !manifest) return null;

    const intensity = turboColormap.snapColorToIntensity([rgb.r, rgb.g, rgb.b]);
    return manifest.min + (intensity / 255) * (manifest.max - manifest.min);
  });

  private _trackHoveredMask = effect(onCleanup => {
    let map = this.map();
    if (!map) return;

    const onMouseMove = (event: MapMouseEvent) => {
      const layers = ["lower-saxony-mask", "lower-saxony-mask-border"];
      this.hoveredMask.set(
        layers.length > 0 &&
          map.queryRenderedFeatures(event.point, {layers}).length > 0,
      );
    };

    map.on("mousemove", onMouseMove);
    onCleanup(() => map.off("mousemove", onMouseMove));
  });

  protected cursorTooltip = new maplibregl.Popup({
    closeButton: false,
    closeOnClick: false,
    className: "radar-cursor-tooltip",
    anchor: "left",
    offset: [12, 0],
  });
  private _attachCursorTooltip = effect(onCleanup => {
    let map = this.map();
    if (!map) return;
    onCleanup(() => this.cursorTooltip.remove());
  });

  private _updateCursorTooltipPosition = effect(() => {
    const position = this.cursorLngLat();
    if (position) this.cursorTooltip.setLngLat(position);
  });

  private cursorTooltipContent = viewChild<ElementRef<HTMLDivElement>>(
    "cursorTooltipContent",
  );
  protected cursorTooltipText = computed(() => {
    const value = this.hoveredRasterValue();
    const manifest = this.manifest();
    return value === null || !manifest
      ? ""
      : `≈ ${Math.floor(value)} ${manifest.unit}`;
  });

  private _updateCursorTooltipValue = effect(() => {
    const map = this.map();
    const value = this.hoveredRasterValue();
    const manifest = this.manifest();
    const content = this.cursorTooltipContent();
    if (!map || value === null || !manifest || !content) {
      this.cursorTooltip.remove();
      return;
    }

    this.cursorTooltip.setDOMContent(content.nativeElement);
    if (!this.cursorTooltip.isOpen()) this.cursorTooltip.addTo(map);
  });

  private _trackHoveredRasterPixel = effect(onCleanup => {
    let map = this.map();
    let bounds = this.rasterBounds();
    this.hoveredRasterPixel.set(null);
    if (!map || !bounds) return;

    let topLeft = MercatorCoordinate.fromLngLat(bounds[0]);
    let bottomRight = MercatorCoordinate.fromLngLat(bounds[2]);

    const onMouseMove = (event: MapMouseEvent) => {
      this.cursorLngLat.set(event.lngLat);
      let source = map.getSource<ImageSource>("radar-data-source");
      let image = source?.image;
      if (!image || !image.width || !image.height) {
        this.hoveredRasterPixel.set(null);
        return;
      }

      const position = MercatorCoordinate.fromLngLat(event.lngLat);
      const u = (position.x - topLeft.x) / (bottomRight.x - topLeft.x);
      const v = (position.y - topLeft.y) / (bottomRight.y - topLeft.y);
      if (u < 0 || u >= 1 || v < 0 || v >= 1) {
        this.hoveredRasterPixel.set(null);
        return;
      }

      // original image pixels, zero-based from the top-left corner
      const x = Math.floor(u * image.width);
      const y = Math.floor(v * image.height);
      this.hoveredRasterPixel.set({x, y});
    };

    map.on("mousemove", onMouseMove);
    onCleanup(() => map.off("mousemove", onMouseMove));
  });

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

  protected timelapseDate = signals.maybe<Dayjs>();
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

  private timelapseCanvas =
    viewChild<ElementRef<HTMLCanvasElement>>("timelapseCanvas");
  private timelapseContext = computed(() =>
    this.timelapseCanvas()?.nativeElement.getContext("2d", {
      willReadFrequently: true,
    }),
  );
  private loadedTimelapseFrame = signal<string | null>(null);

  protected drawTimelapseImage(image: HTMLImageElement, url: string) {
    this.loadedTimelapseFrame.set(null);
    const context = this.timelapseContext();
    if (!context) return;

    const canvas = context.canvas;
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    try {
      context.drawImage(image, 0, 0);
      this.loadedTimelapseFrame.set(url);
    } catch (error) {
      console.warn("Could not read radar image pixel data", error);
    }
  }

  private timelapseIntervalId = signal<TimerId | null>(null);
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
