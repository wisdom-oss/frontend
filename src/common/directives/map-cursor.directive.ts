import {effect, input, signal, Directive} from "@angular/core";
import {Map} from "maplibre-gl";

type CssCursor =
  | "auto"
  | "default"
  | "none"
  | "context-menu"
  | "help"
  | "pointer"
  | "progress"
  | "wait"
  | "cell"
  | "crosshair"
  | "text"
  | "vertical-text"
  | "alias"
  | "copy"
  | "move"
  | "no-drop"
  | "not-allowed"
  | "grab"
  | "grabbing"
  | "all-scroll"
  | "col-resize"
  | "row-resize"
  | "n-resize"
  | "e-resize"
  | "s-resize"
  | "w-resize"
  | "ne-resize"
  | "nw-resize"
  | "se-resize"
  | "sw-resize"
  | "ew-resize"
  | "ns-resize"
  | "nesw-resize"
  | "nwse-resize"
  | "zoom-in"
  | "zoom-out"
  | "inherit"
  | "initial"
  | "revert"
  | "revert-layer"
  | "unset";

/**
 * Directive to control the CSS cursor of a `mgl-map` (`MapComponent`).
 *
 * This centralizes cursor updates, so you don’t have to manually change the cursor
 * in multiple places. It automatically attaches to every `<mgl-map>` once imported.
 *
 * You can update the `cursor` input to reflect interaction state — for example,
 * switching from `"grab"` to `"pointer"` to signal clickable elements on the map.
 *
 * Example:
 * ```html
 * <mgl-map [cursor]="'pointer'"></mgl-map>
 * ```
 */
@Directive({
  selector: "mgl-map",
  host: {
    "(mapLoad)": "onLoad($any($event))",
  },
})
export class MapCursorDirective {
  readonly cursor = input<CssCursor>("grab");
  private canvasContainer = signal<HTMLElement | undefined>(undefined);

  constructor() {
    effect(() => {
      let canvasContainer = this.canvasContainer();
      if (!canvasContainer) return;
      canvasContainer.style.cursor = this.cursor();
    });
  }

  onLoad(map: Map) {
    this.canvasContainer.set(map.getCanvasContainer());
  }
}
