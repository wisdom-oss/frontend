import {inject, output, Component} from "@angular/core";

import {WaterDemandPrediction2Service as Service} from "../../water-demand-prediction2.service";
import {PmdArimaPredictionService} from "../../../../api/pmd-arima-prediction.service";
import {signals} from "../../../../common/signals";

import ModelId = PmdArimaPredictionService.ModelId;
import {NgIconComponent, provideIcons} from "@ng-icons/core";
import {remixAddBoxFill} from "@ng-icons/remixicon";

@Component({
  selector: "wdp-select-model-view",
  imports: [NgIconComponent],
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

  readonly modelId = output<ModelId>();
  readonly newModel = output<void>();
}
