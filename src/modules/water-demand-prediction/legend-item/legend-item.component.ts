import {UpperCasePipe, DecimalPipe} from "@angular/common";
import {effect, input, output, Component} from "@angular/core";
import {provideIcons, NgIconComponent} from "@ng-icons/core";
import {remixSquareFill} from "@ng-icons/remixicon";
import {TranslateDirective} from "@ngx-translate/core";

import {WaterDemandPredictionService} from "../../../api/water-demand-prediction.service";
import {RgbaColor} from "../../../common/utils/rgba-color";
import {signals} from "../../../common/signals";
import {TranslateAttrDirective} from "../../../common/directives/translate-attr.directive";

type Resolution = WaterDemandPredictionService.Resolution;

@Component({
  selector: "legend-item",
  imports: [
    DecimalPipe,
    NgIconComponent,
    TranslateAttrDirective,
    TranslateDirective,
    UpperCasePipe,
  ],
  templateUrl: "./legend-item.component.html",
  providers: [
    provideIcons({
      remixSquareFill,
    }),
  ],
})
export class LegendItemComponent {
  protected lang = signals.lang();

  readonly color = input.required<RgbaColor>();
  readonly smartmeter = input.required<string>();
  readonly resolution = input.required<Resolution>();
  readonly mae = input<number>();
  readonly mse = input<number>();
  readonly rmse = input<number>();
  readonly r2 = input<number>();

  protected metrics = ["mae", "mse", "rmse", "r2"] as const;

  protected visible = signals.toggleable(true);
  protected visibleEvent = output<boolean>({alias: "visible"});
  private visibleUpdate = effect(() => this.visibleEvent.emit(this.visible()));
}
