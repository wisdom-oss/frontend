import {inject, output, Component} from "@angular/core";

import {WaterDemandPrediction2Service as Service} from "../../water-demand-prediction2.service";
import {PmdArimaPredictionService} from "../../../../api/pmd-arima-prediction.service";
import {signals} from "../../../../common/signals";

import ModelId = PmdArimaPredictionService.ModelId;

@Component({
  selector: "wdp-select-model-view",
  imports: [],
  templateUrl: "./select-model-view.component.html",
})
export class WdpSelectModelViewComponent {
  protected service = inject(Service);
  protected lang = signals.lang();

  readonly modelId = output<ModelId>();
}
