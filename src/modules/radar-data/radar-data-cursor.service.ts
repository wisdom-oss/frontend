import {effect, inject, signal, Injector, Service, Signal} from "@angular/core";
import {
  MercatorCoordinate,
  MapMouseEvent,
  LngLat,
  Map,
  ImageSource,
  ImageSourceSpecification,
} from "maplibre-gl";

@Service()
export class RadarDataCursorService {
  private injector = inject(Injector);
  private pixel = signal<{x: number; y: number} | null>(null);
  private onMask = signal(false);
  private position = signal<LngLat | null>(null);

  readonly hoveredRasterPixel = this.pixel.asReadonly();
  readonly hoveredMask = this.onMask.asReadonly();
  readonly cursorLngLat = this.position.asReadonly();

  track(
    mapSignal: Signal<Map | undefined>,
    boundsSignal: Signal<ImageSourceSpecification["coordinates"] | undefined>,
  ) {
    effect(
      onCleanup => {
        const map = mapSignal();
        if (!map) return;

        const onMouseMove = (event: MapMouseEvent) => {
          const layers = ["lower-saxony-mask", "lower-saxony-mask-border"];
          this.onMask.set(
            map.queryRenderedFeatures(event.point, {layers}).length > 0,
          );
        };

        map.on("mousemove", onMouseMove);
        onCleanup(() => map.off("mousemove", onMouseMove));
      },
      {injector: this.injector},
    );

    effect(
      onCleanup => {
        const map = mapSignal();
        const bounds = boundsSignal();
        this.pixel.set(null);
        if (!map || !bounds) return;

        const topLeft = MercatorCoordinate.fromLngLat(bounds[0]);
        const bottomRight = MercatorCoordinate.fromLngLat(bounds[2]);
        const onMouseMove = (event: MapMouseEvent) => {
          this.position.set(event.lngLat);
          const image = map.getSource<ImageSource>("radar-data-source")?.image;
          if (!image || !image.width || !image.height) {
            this.pixel.set(null);
            return;
          }

          const position = MercatorCoordinate.fromLngLat(event.lngLat);
          const u = (position.x - topLeft.x) / (bottomRight.x - topLeft.x);
          const v = (position.y - topLeft.y) / (bottomRight.y - topLeft.y);
          if (u < 0 || u >= 1 || v < 0 || v >= 1) {
            this.pixel.set(null);
            return;
          }

          // original image pixels, zero-based from the top-left corner
          this.pixel.set({
            x: Math.floor(u * image.width),
            y: Math.floor(v * image.height),
          });
        };

        map.on("mousemove", onMouseMove);
        onCleanup(() => map.off("mousemove", onMouseMove));
      },
      {injector: this.injector},
    );
  }
}
