import {model, Component} from "@angular/core";
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
  throttleSize = model.required<number>();
  throttleHeight = model.required<number>();
}
