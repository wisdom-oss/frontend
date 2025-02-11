import {KeyValuePipe} from "@angular/common";
import {
  computed,
  input,
  signal,
  Component,
  WritableSignal,
  ModelSignal,
  Signal,
} from "@angular/core";

import {signals} from "../../../../common/signals";
import { NgIcon, provideIcons } from "@ng-icons/core";
import { remixStackFill } from "@ng-icons/remixicon";
import { TranslatePipe } from "@ngx-translate/core";

@Component({
  selector: "growl-layer-selection-control",
  imports: [
    KeyValuePipe, 
    NgIcon, 
    TranslatePipe,
  ],
  templateUrl: "./layer-selection-control.component.html",
  styles: ``,
  providers: [
    provideIcons({remixStackFill})
  ]
})
export class LayerSelectionControlComponent {
  protected collapsed = signal(true);

  readonly layers = input.required<Record<string, signals.ToggleableSignal<WritableSignal<boolean>>>>();
}
