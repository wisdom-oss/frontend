import {NgClass, AsyncPipe} from "@angular/common";
import {
  computed,
  effect,
  inject,
  output,
  signal,
  untracked,
  Component,
} from "@angular/core";
import {FormControlDirective, ReactiveFormsModule} from "@angular/forms";
import {ChartDataset, TooltipItem, Scale} from "chart.js";
import dayjs, {Dayjs} from "dayjs";
import {Duration} from "dayjs/plugin/duration";
import {BaseChartDirective} from "ng2-charts";

import {PmdArimaPredictionService} from "../../../../api/pmd-arima-prediction.service";
import {EmptyPipe} from "../../../../common/pipes/empty.pipe";
import {QueryParamService} from "../../../../common/services/query-param.service";
import {signals} from "../../../../common/signals";
import {typeUtils} from "../../../../common/utils/type-utils";

import MeterId = PmdArimaPredictionService.SmartMeterId;
import TrainingId = PmdArimaPredictionService.TrainingId;
import WeatherCapability = PmdArimaPredictionService.WeatherCapability;
import {
  TranslateDirective,
  TranslatePipe,
  TranslateService,
} from "@ngx-translate/core";

@Component({
  selector: "wdp-new-model-view",
  imports: [
    BaseChartDirective,
    EmptyPipe,
    AsyncPipe,
    ReactiveFormsModule,
    NgClass,
    TranslateDirective,
    TranslatePipe,
  ],
  templateUrl: "./new-model-view.component.html",
})
export class WdpNewModelViewComponent {
  private predictionService = inject(PmdArimaPredictionService);
  private queryParams = inject(QueryParamService);
  protected lang = signals.lang();
  protected translateService = inject(TranslateService);
  protected dayjs = dayjs; // dayjs re-export

  readonly return = output();

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

  protected startPointRange = computed(() => {
    let meterData = this.selectedMeterData();
    if (!meterData || !meterData.length) return undefined;
    let first = meterData[0];
    let last = meterData[meterData.length - 1];
    return [first.time, last.time] as const;
  });
  _startPointRange = effect(() => console.log(this.startPointRange()));
  protected startPointChoice = signals.maybe<Dayjs>();

  protected timeSpanOptions = [
    dayjs.duration(1, "day"),
    dayjs.duration(1, "week"),
    dayjs.duration(1, "month"),
    dayjs.duration(3, "months"),
    dayjs.duration(6, "months"),
  ];
  protected timeSpanOptionsConstrained = computed(() => {
    let range = this.startPointRange();
    let choice = this.startPointChoice();
    if (!range || !choice) return [];
    let [_, end] = range;
    return this.timeSpanOptions.filter(duration =>
      choice.add(duration).isBefore(end),
    );
  });
  private enableTimeSpanSelector = effect(() => {
    let options = this.timeSpanOptionsConstrained();
    if (!options.length) this.timeSpanChoice.formControl.disable();
    else this.timeSpanChoice.formControl.enable();
  });
  _timeSpanOptionsConstrained = effect(() =>
    console.log(this.timeSpanOptionsConstrained()),
  );
  protected timeSpanChoice = signals.formControl<Duration | undefined>(
    undefined,
  );
  _timeSpanChoice = effect(() => console.log(this.timeSpanChoice()));
  private keepTimeSpanChoiceValid = effect(() => {
    let options = this.timeSpanOptionsConstrained();
    let choice = untracked(this.timeSpanChoice);
    if (!choice) return;
    if (!options.includes(choice)) this.timeSpanChoice.set(undefined);
  });

  protected commentPlaceholder = computed(() => {
    let lang = this.lang();
    let template = this.translateService.instant(
      "water-demand-prediction.choice.comment-placeholder-template",
    );

    let meter = this.selectedMeter();
    let startPoint = this.startPointChoice();
    let timeSpan = this.timeSpanChoice();
    if (!meter || !startPoint || !timeSpan) return undefined;
    return template
      .replace("${name}", meter.name)
      .replace("${id}", meter.id.get())
      .replace("${startPoint}", startPoint.locale(lang).format("LL"))
      .replace("${timeSpan}", timeSpan.locale(lang).humanize());
  });
  protected comment = signals.maybe<string>();
  _comment = effect(() => console.log(this.comment()));

  protected trainingParams = computed(() => {
    let startPoint = this.startPointChoice();
    let timeSpan = this.timeSpanChoice();
    let comment = this.comment() || this.commentPlaceholder();
    console.log({startPoint, timeSpan, comment});
    if (!startPoint || !timeSpan || !comment) return undefined;
    return {startPoint, timeSpan, comment};
  });
  _trainingParams = effect(() => console.log(!this.trainingParams()));

  protected startTrainingTrigger = signals.trigger();
  _startTrainingTrigger = effect(() => {
    this.startTrainingTrigger();
    console.log("they clicked");
  });

  protected triggerTrainingParams = computed(() => {
    let params = untracked(this.trainingParams);
    this.startTrainingTrigger();
    return params;
  });
  _triggerTrainingParams = effect(() =>
    console.log(this.triggerTrainingParams()),
  );

  protected startTraining = this.predictionService.training.start(
    this.selectedMeterId,
    this.triggerTrainingParams,
  );
  protected startTrainingError = this.startTraining.resource.error;
  _startTrainingError = effect(() => console.log(this.startTrainingError()));

  // Training Status View

  protected trainingId = this.queryParams.signal(
    "training",
    TrainingId.queryParamOpts(),
  );
  _trainingId = effect(() => console.log(this.trainingId()));
  private loadTrainingId = effect(() => {
    let startTraining = this.startTraining();
    if (!startTraining) return;
    this.trainingId.set(startTraining.trainingId);
  });

  protected trainingStatus = computed(() => {
    let id = this.trainingId();
    if (!id) return undefined;
    return this.predictionService.training.status(id, {
      onOpen: () => this.isTraining.set(true),
      onClose: () => this.isTraining.set(false),
    });
  });
  protected isTraining = signal(false);
  _trainingStatus = effect(() => console.log(this.trainingStatus()?.()));

  protected trainingLog = signals.array<string>();
  private appendTrainingLog = effect(() => {
    let message = this.trainingStatus()?.();
    if (message) this.trainingLog.push(message);
  });

  protected returnToSelectingModels() {
    this.trainingId.set(undefined).then(() => this.return.emit());
  }
}
