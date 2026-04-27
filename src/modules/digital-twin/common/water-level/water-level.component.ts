import {model, Component} from "@angular/core";
import {provideIcons, NgIconComponent} from "@ng-icons/core";
import {remixContrastDrop2Line} from "@ng-icons/remixicon";
import {TranslateDirective} from "@ngx-translate/core";

@Component({
  selector: "water-level",
  imports: [TranslateDirective, NgIconComponent],
  templateUrl: "./water-level.component.html",
  providers: [
    provideIcons({
      remixContrastDrop2Line,
    }),
  ],
})
export class WaterLevelComponent {
  waterLevelSlider = model.required<number>();
  waterLevel = model.required<number>();
}
