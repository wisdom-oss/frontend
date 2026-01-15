import {computed, input, output, Component} from "@angular/core";

import {WaterDemandPrediction2Service as Service} from "../../water-demand-prediction2.service";
import {typeUtils} from "../../../../common/utils/type-utils";

import Signaled = typeUtils.Signaled;
import {BaseChartDirective} from "ng2-charts";
import {NgIconComponent, provideIcons} from "@ng-icons/core";
import {remixAddLargeFill, remixCloseLargeFill} from "@ng-icons/remixicon";
import {TranslateAttrDirective} from "../../../../common/directives/translate-attr.directive";
import {chain} from "../../../../common/utils/chain";
import {Scale, TooltipItem} from "chart.js";
import dayjs from "dayjs";
import {signals} from "../../../../common/signals";
import {TranslateDirective, TranslatePipe} from "@ngx-translate/core";

type Labels = Signaled<ReturnType<Service["labels"]>>;
type Datasets = Signaled<ReturnType<Service["datasets"]>>;

@Component({
  selector: "wdp-charts-view",
  imports: [
    BaseChartDirective,
    NgIconComponent,
    TranslateAttrDirective,
    TranslateDirective,
    TranslatePipe,
  ],
  templateUrl: "./charts-view.component.html",
  styleUrl: "./charts-view.component.scss",
  providers: [
    provideIcons({
      remixAddLargeFill,
      remixCloseLargeFill,
    }),
  ],
})
export class WdpChartsViewComponent {
  protected lang = signals.lang();

  readonly historicLabels = input<Labels>();
  readonly historicDatasets = input<Datasets>();

  readonly predictionLabels = input<Labels>();
  readonly predictionDatasets = input<Datasets>();

  readonly addModel = output();
  readonly clearChart = output();

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

  protected xTicks(lang: "en" | "de"): (this: Scale, value: any) => string {
    return function (this: Scale, value: any): string {
      let label = this.getLabelForValue(value);
      return dayjs(label).locale(lang).format("LL");
    };
  }

  protected tooltipTitle(
    lang: "en" | "de",
  ): (items: TooltipItem<"bar">[]) => string {
    return function (items: TooltipItem<"bar">[]): string {
      let label = items[0].label;
      return dayjs(label).locale(lang).format("LL");
    };
  }

  protected tooltipLabel(item: TooltipItem<"bar">): string {
    let raw = item.raw as {x: string; y: number};
    return `~${Math.round(raw.y)} m³`;
  }
}
