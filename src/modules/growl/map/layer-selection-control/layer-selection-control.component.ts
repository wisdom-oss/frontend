import {input, signal, Component, WritableSignal, computed} from "@angular/core";
import {provideIcons, NgIcon} from "@ng-icons/core";
import {remixStackFill} from "@ng-icons/remixicon";
import {TranslatePipe} from "@ngx-translate/core";

import {signals} from "../../../../common/signals";

@Component({
  selector: "growl-layer-selection-control",
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
