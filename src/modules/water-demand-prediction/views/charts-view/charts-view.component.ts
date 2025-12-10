import {computed, input, output, Component} from "@angular/core";

import {WaterDemandPrediction2Service as Service} from "../../water-demand-prediction2.service";
import {typeUtils} from "../../../../common/utils/type-utils";

import Signaled = typeUtils.Signaled;
import {BaseChartDirective} from "ng2-charts";
import {NgIconComponent, provideIcons} from "@ng-icons/core";
import {remixAddLargeFill} from "@ng-icons/remixicon";
import {TranslateAttrDirective} from "../../../../common/directives/translate-attr.directive";
import {chain} from "../../../../common/utils/chain";

type Labels = Signaled<ReturnType<Service["labels"]>>;
type Datasets = Signaled<ReturnType<Service["datasets"]>>;

@Component({
  selector: "wdp-charts-view",
  imports: [BaseChartDirective, NgIconComponent, TranslateAttrDirective],
  templateUrl: "./charts-view.component.html",
  styleUrl: "./charts-view.component.scss",
  providers: [
    provideIcons({
      remixAddLargeFill,
    }),
  ],
})
export class WdpChartsViewComponent {
  readonly historicLabels = input<Labels>();
  readonly historicDatasets = input<Datasets>();

  readonly predictionLabels = input<Labels>();
  readonly predictionDatasets = input<Datasets>();

  readonly changeModel = output();

  protected scaleMin = computed(() => {
    let historic = this.historicDatasets();
    let prediction = this.predictionDatasets();
    if (!historic || !prediction) return 0;

    let min = 0;
    for (let {data} of chain(historic, prediction)) {
      for (let {y, yMin} of data) {
        if (y) min = Math.min(y, min);
        if (yMin) min = Math.min(yMin, min);
      }
    }

    return Math.floor(min);
  });

  protected scaleMax = computed(() => {
    let historic = this.historicDatasets();
    let prediction = this.predictionDatasets();
    if (!historic || !prediction) return 0;

    let max = 0;
    for (let {data} of chain(historic, prediction)) {
      for (let {y, yMax} of data) {
        if (y) max = Math.max(y, max);
        if (yMax) max = Math.max(yMax, max);
      }
    }

    return Math.ceil(max);
  });
}
