import {AsyncPipe} from "@angular/common";
import {computed, effect, inject, Component} from "@angular/core";
import {ChartDataset, TooltipItem, Scale} from "chart.js";
import dayjs, {Dayjs} from "dayjs";
import {Duration} from "dayjs/plugin/duration";
import {BaseChartDirective} from "ng2-charts";

import {PmdArimaPredictionService} from "../../../../api/pmd-arima-prediction.service";
import {EmptyPipe} from "../../../../common/pipes/empty.pipe";
import {QueryParamService} from "../../../../common/services/query-param.service";
import {signals} from "../../../../common/signals";

import MeterId = PmdArimaPredictionService.SmartMeterId;
import WeatherCapability = PmdArimaPredictionService.WeatherCapability;
import {typeUtils} from "../../../../common/utils/type-utils";

@Component({
  selector: "wdp-new-model-view",
  imports: [BaseChartDirective, EmptyPipe, AsyncPipe],
  templateUrl: "./new-model-view.component.html",
})
export class WdpNewModelViewComponent {
  private predictionService = inject(PmdArimaPredictionService);
  private queryParams = inject(QueryParamService);
  protected lang = signals.lang();
  protected dayjs = dayjs; // dayjs re-export

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

  protected selectedMeterId = this.queryParams.signal(
    "meter",
    MeterId.queryParamOpts(),
  );
  protected selectedMeter = computed(() => {
    let id = this.selectedMeterId();
    if (!id) return;
    return this.meters()?.find(meter => meter.id == id);
  });
  protected selectedMeterData = this.predictionService.fetchRecordedUsages(
    this.selectedMeterId,
  );

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

  // Select Options View

  protected startPointChoice = signals.maybe<Dayjs>();

  protected timeSpanOptions = [
    dayjs.duration(1, "day"),
    dayjs.duration(1, "week"),
    dayjs.duration(1, "month"),
    dayjs.duration(3, "months"),
    dayjs.duration(6, "months"),
  ];
  protected timeSpanChoice = signals.maybe<Duration>();
  _timeSpanChoice = effect(() => console.log(this.timeSpanChoice()));

  protected weatherCapabilityOptions =
    this.predictionService.fetchWeatherCapabilities(
      computed(() => {
        let startPoint = this.startPointChoice();
        let timeSpan = this.timeSpanChoice();
        let options: typeUtils.Signaled<
          Parameters<PmdArimaPredictionService["fetchWeatherCapabilities"]>[0]
        > = {};
        if (startPoint) options.start = startPoint;
        if (startPoint && timeSpan) options.end = startPoint.add(timeSpan);
        return options;
      }),
    );
  protected weatherCapabilityChoice = signals.maybe<WeatherCapability>();

  protected comment = signals.maybe<string>();
  _comment = effect(() => console.log(this.comment()));

  // protected trainingStatus = this.predictionService.training.status();
}
