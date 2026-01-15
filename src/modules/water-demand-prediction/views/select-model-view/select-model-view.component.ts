import {inject, input, output, Component} from "@angular/core";
import {provideIcons, NgIconComponent} from "@ng-icons/core";
import {remixAddBoxFill} from "@ng-icons/remixicon";
import {TranslateDirective} from "@ngx-translate/core";

import {WaterDemandPrediction2Service as Service} from "../../water-demand-prediction.service";
import {PmdArimaPredictionService} from "../../../../api/pmd-arima-prediction.service";
import {signals} from "../../../../common/signals";

import ModelId = PmdArimaPredictionService.ModelId;

@Component({
  selector: "wdp-select-model-view",
  imports: [NgIconComponent, TranslateDirective],
  templateUrl: "./select-model-view.component.html",
  providers: [
    provideIcons({
      remixAddBoxFill,
    }),
  ],
})
export class WdpSelectModelViewComponent {
  protected service = inject(Service);
  protected lang = signals.lang();

  readonly selectedModels = input<ModelId[]>([]);

  readonly modelId = output<ModelId>();
  readonly newModel = output<void>();
}
