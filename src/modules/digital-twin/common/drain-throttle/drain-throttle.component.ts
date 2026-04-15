import {signal, Component, Input, WritableSignal} from "@angular/core";
import {provideIcons, NgIconComponent} from "@ng-icons/core";
import {remixCustomSize, remixExpandHeightLine} from "@ng-icons/remixicon";
import {TranslateDirective} from "@ngx-translate/core";

@Component({
  selector: "drain-throttle",
  imports: [TranslateDirective, NgIconComponent],
  templateUrl: "./drain-throttle.component.html",
  providers: [
    provideIcons({
      remixCustomSize,
      remixExpandHeightLine,
    }),
  ],
})
export class DrainThrottleComponent {
  @Input() throttleSize: WritableSignal<number> = signal(0);
  @Input() throttleHeight: WritableSignal<number> = signal(0);
}
