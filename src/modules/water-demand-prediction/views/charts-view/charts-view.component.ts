import {input, output, Component} from "@angular/core";

import {
  WaterDemandPrediction2Service as Service,
  WaterDemandPrediction2Service,
} from "../../water-demand-prediction2.service";
import {typeUtils} from "../../../../common/utils/type-utils";

import Signaled = typeUtils.Signaled;
import {BaseChartDirective} from "ng2-charts";

type Labels = Signaled<ReturnType<Service["labels"]>>;
type Datasets = Signaled<ReturnType<Service["datasets"]>>;

@Component({
  selector: "wdp-charts-view",
  imports: [BaseChartDirective],
  templateUrl: "./charts-view.component.html",
  styleUrl: "./charts-view.component.scss",
})
export class WdpChartsViewComponent {
  readonly historicLabels = input<Labels>();
  readonly historicDatasets = input<Datasets>();

  readonly predictionLabels = input<Labels>();
  readonly predictionDatasets = input<Datasets>();

  readonly changeModel = output();
}
