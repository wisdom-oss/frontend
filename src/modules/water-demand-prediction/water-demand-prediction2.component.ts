import {effect, inject, Component} from "@angular/core";

import {PmdArimaPredictionService} from "../../api/pmd-arima-prediction.service";

type Service = PmdArimaPredictionService;

@Component({
  imports: [],
  templateUrl: "./water-demand-prediction2.component.html",
})
export class WaterDemandPrediction2Component {
  private service = inject(PmdArimaPredictionService);

  protected models = this.service.fetchModels();
  protected meters = this.service.fetchMeters();

  _models = effect(() => console.log(this.models()));
  _meters = effect(() => console.log(this.meters()));
}
