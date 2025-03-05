import {
  computed,
  input,
  signal,
  Component,
  WritableSignal,
} from "@angular/core";
import {provideIcons, NgIcon} from "@ng-icons/core";
import {remixStackFill} from "@ng-icons/remixicon";
import {TranslatePipe} from "@ngx-translate/core";

import {signals} from "../../../signals";

@Component({
  selector: "map-layer-selection-control",
  imports: [NgIcon, TranslatePipe],
  templateUrl: "./layer-selection-control.component.html",
  styles: ``,
  providers: [provideIcons({remixStackFill})],
})
export class LayerSelectionControlComponent {
  readonly layers =
    input.required<
      Record<string, signals.ToggleableSignal<WritableSignal<boolean>>>
    >();

  // don't use `keyvalue` pipe to ensure order
  protected layerIter = computed(() => Object.entries(this.layers()));
  protected collapsed = signal(true);
}
