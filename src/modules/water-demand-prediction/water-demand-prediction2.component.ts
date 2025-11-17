import {Component, effect, inject} from "@angular/core";
import { PmdArimaPredictionService } from "../../api/pmd-arima-prediction.service";

type Service = PmdArimaPredictionService;

@Component({
  imports: [],
  templateUrl: "./water-demand-prediction2.component.html",
})
export class WaterDemandPrediction2Component {
  private service = inject(PmdArimaPredictionService);

  protected models = this.service.fetchModels();

  _ = effect(() => console.log(this.models()));
}
