import {AsyncPipe} from "@angular/common";
import {computed, inject, signal, Component} from "@angular/core";
import {ChartDataset, TooltipItem, Scale} from "chart.js";
import dayjs from "dayjs";
import {BaseChartDirective} from "ng2-charts";

import {PmdArimaPredictionService} from "../../../../api/pmd-arima-prediction.service";
import {signals} from "../../../../common/signals";
import {EmptyPipe} from "../../../../common/pipes/empty.pipe";

import ModelId = PmdArimaPredictionService.ModelId;
import MeterId = PmdArimaPredictionService.SmartMeterId;

@Component({
  selector: "wdp-new-model-view",
  imports: [BaseChartDirective, EmptyPipe, AsyncPipe],
  templateUrl: "./new-model-view.component.html",
})
export class WdpNewModelViewComponent {
  private predictionService = inject(PmdArimaPredictionService);
  protected lang = signals.lang();

  // Select Meters View

  protected meters = this.predictionService.fetchMeters();
  protected meterUsages = computed(() => {
    let meters = this.meters() ?? [];
    let map = new Map<
      MeterId,
      Promise<ChartDataset<"bar", {x: string; y: number}[]>>
    >();
    for (let meter of meters) {
      map.set(
        meter.id,
        this.predictionService.fetchRecordedUsages
          .get(meter.id, {bucketSize: dayjs.duration(1, "month")})
          .then(data => ({
            backgroundColor: "#0088AA", // brand primary color
            data: data.map(({time, value}) => ({
              x: time.toISOString(),
              y: value,
            })),
          })),
      );
    }
    return map;
  });

  protected selectedMeter = signals.maybe<MeterId>();

  protected xTicks(lang: "en" | "de"): (this: Scale, value: any) => string {
    return function (this: Scale, value: any): string {
      let label = this.getLabelForValue(value);
      return dayjs(label).locale(lang).format("MMM YYYY");
    };
  }

  protected yTicks(this: Scale, value: any): string {
    return `${value} m³`;
  }

  protected tooltipTitle(
    lang: "en" | "de",
  ): (items: TooltipItem<"bar">[]) => string {
    return function (items: TooltipItem<"bar">[]): string {
      let label = items[0].label;
      return dayjs(label).locale(lang).format("MMM YYYY");
    };
  }

  protected tooltipLabel(item: TooltipItem<"bar">): string {
    let raw = item.raw as {x: string; y: number};
    return `~${Math.round(raw.y)} m³`;
  }

  // Training Status View

  // protected trainingStatus = this.predictionService.training.status();
}
