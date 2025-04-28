import {
  effect,
  signal,
  Directive,
  AfterViewInit,
  HostListener,
} from "@angular/core";
import {MapComponent} from "@maplibre/ngx-maplibre-gl";

/**
 * Directive to fix map sizing issues on load for {@link MapComponent}.
 *
 * In some cases, the {@link MapComponent} may not size itself correctly when
 * the map is first loaded.
 * This directive automatically calls the `resize` method on the map after the
 * view is initialized and the window load event triggers, ensuring the map
 * renders correctly.
 *
 * To use, just import this directive where needed, it applies to every
 * `mgl-map` automatically.
 */
@Directive({
  selector: "mgl-map",
})
export class ResizeMapOnLoadDirective implements AfterViewInit {
  private viewInit = signal(false);
  private loaded = signal(false);

  @HostListener("window:load")
  onLoad() {
    this.loaded.set(true);
  }

  constructor(private map: MapComponent) {
    effect(() => {
      let viewInit = this.viewInit();
      let loaded = this.loaded();
      if (viewInit && loaded) this.map!.mapInstance.resize();
    });
  }

  ngAfterViewInit(): void {
    this.viewInit.set(true);
  }
}
