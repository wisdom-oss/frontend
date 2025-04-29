import {computed, effect, input, signal, Component} from "@angular/core";
import {provideIcons, NgIcon} from "@ng-icons/core";
import {remixStackFill} from "@ng-icons/remixicon";
import {TranslatePipe} from "@ngx-translate/core";

import {signals} from "../../../signals";

/**
 * A control component for `mgl-map` (`MapComponent`) that makes it easy to toggle map layers.
 *
 * ## Usage
 * Pass a record to `layers` where the keys are layer names (strings),
 * and the values are `ToggleableSignal`s (e.g. `signal.toggleable(true)`).
 * Clicking a layer toggles its signal. Ctrl+Click toggles all *other* layers.
 *
 * ### Inputs:
 * - `layers`: A `Record<string, ToggleableSignal>`. This defines the toggleable layers.
 * - `collapsible`: Optional boolean (default: `true`). When true, the control will auto-collapse.
 * - `translatePrefix`: Optional string. If set, the layer keys will be translated using this prefix.
 *
 * ## Notes
 * This component is display-only; actual use of the toggled signals
 * (e.g. showing/hiding layers) is up to the parent.
 */
@Component({
  selector: "map-layer-selection-control",
  imports: [NgIcon, TranslatePipe],
  templateUrl: "./layer-selection-control.component.html",
  styles: ``,
  providers: [provideIcons({remixStackFill})],
})
export class LayerSelectionControlComponent {
  readonly translatePrefix = input("");
  readonly collapsible = input(true);

  readonly layers = input.required<Record<string, signals.ToggleableSignal>>();

  // don't use `keyvalue` pipe to ensure order
  protected layerIter = computed(() => Object.entries(this.layers()));
  protected collapsed = signal(true);

  constructor() {
    effect(() => this.collapsed.set(this.collapsible()));
  }

  onClick(event: MouseEvent, key: string, signal: signals.ToggleableSignal) {
    event.preventDefault();
    if (!event.ctrlKey) return signal.toggle();

    for (let [layer, signal] of Object.entries(this.layers())) {
      if (layer == key) continue;
      signal.toggle();
    }
  }
}
