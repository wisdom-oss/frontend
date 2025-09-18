import {
  computed,
  effect,
  inject,
  signal,
  Component,
  OnInit,
  Signal,
  WritableSignal,
} from "@angular/core";
import {Params, ActivatedRoute, Router} from "@angular/router";
import {provideIcons, NgIcon} from "@ng-icons/core";
import {
  remixArrowDownDoubleFill,
  remixArrowRightDoubleFill,
  remixArrowUpDoubleFill,
  remixBarChartFill,
  remixDeleteBin2Line,
  remixHistoryFill,
  remixLoader5Fill,
  remixPingPongLine,
  remixSparklingFill,
} from "@ng-icons/remixicon";
import {
  TranslateDirective,
  TranslatePipe,
  TranslateService,
} from "@ngx-translate/core";
import {
  ChartData,
  ChartDataset as ChartJsDataset,
  LegendItem,
  LegendOptions,
  TickOptions,
} from "chart.js";
import {Chart} from "chart.js";
import dayjs from "dayjs";
import {BaseChartDirective} from "ng2-charts";
import typia from "typia";

import {WaterDemandPrediction2Service} from "../../api/water-demand-prediction2.service";
import {signals} from "../../common/signals";
import {DropdownComponent} from "../../common/components/dropdown/dropdown.component";
import {EmptyPipe} from "../../common/pipes/empty.pipe";
import {fromEntries} from "../../common/utils/from-entries";
import {RgbaColor} from "../../common/utils/rgba-color";
import {zip} from "../../common/utils/zip";
import {typeUtils} from "../../common/utils/type-utils";
import {keys} from "../../common/utils/keys";

type Resolution = WaterDemandPrediction2Service.Resolution;
type Timeframe = WaterDemandPrediction2Service.Timeframe;
type WeatherCapability = WaterDemandPrediction2Service.WeatherCapability;
type StartPoint = keyof (typeof WaterDemandPrediction2Service)["START_POINTS"];
type ChartDataset = ChartJsDataset<"bar", {x: string; y: number}[]>;
type ModelParams = Exclude<
  typeUtils.Signaled<
    Parameters<WaterDemandPrediction2Service["trainModel"]>[0]
  >,
  undefined
>;

@Component({
  imports: [
    BaseChartDirective,
    DropdownComponent,
    EmptyPipe,
    NgIcon,
    TranslateDirective,
    TranslatePipe,
  ],
  templateUrl: "./water-demand-prediction2.component.html",
  styleUrl: "./water-demand-prediction2.component.scss",
  providers: [
    provideIcons({
      remixArrowDownDoubleFill,
      remixArrowRightDoubleFill,
      remixArrowUpDoubleFill,
      remixBarChartFill,
      remixDeleteBin2Line,
      remixHistoryFill,
      remixLoader: remixLoader5Fill,
      remixPingPongLine,
      remixSparklingFill,
    }),
  ],
})
export class WaterDemandPrediction2Component implements OnInit {
  protected Service = WaterDemandPrediction2Service;
  private service = inject(WaterDemandPrediction2Service);
  private translate = inject(TranslateService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  protected lang = signals.lang();

  private meterInformation = this.service.fetchMeterInformation();

  protected chartResolution = signal<Resolution>("daily");
  protected chartDatasets = {
    historic: {
      hourly: signals.array<ChartDataset>(),
      daily: signals.array<ChartDataset>(),
      weekly: signals.array<ChartDataset>(),
    } satisfies Record<Resolution, any>,
    predictions: signals.array<ChartDataset>(),
  } as const;

  private makeChartLabels(
    datasets: Signal<readonly ChartDataset[]>,
  ): Signal<string[]> {
    return computed(() => {
      let sets = datasets();
      let dates = new Set(sets.flatMap(set => set.data.map(({x}) => x)));
      return Array.from(dates).sort();
    });
  }
  protected chartLabels = {
    historic: this.makeChartLabels(
      computed(() => this.chartDatasets.historic[this.chartResolution()]()),
    ),
    predictions: this.makeChartLabels(this.chartDatasets.predictions),
  };

  protected choices = {
    resolution: signals.maybe<Resolution>(),
    timeframe: signals.maybe<Timeframe>(),
    smartmeter: signals.maybe<string>(),
    startPoint: signals.maybe<StartPoint>(),
    weatherCapability: signals.maybe<WeatherCapability>(),
    weatherColumn: signals.maybe<string>(),
  } as const;

  protected options = {
    resolution: fromEntries(
      WaterDemandPrediction2Service.RESOLUTIONS.map(resolution => [
        resolution,
        `water-demand-prediction.resolution.${resolution}`,
      ]),
    ) satisfies Record<Resolution, string>,
    timeframe: computed(() => ({
      all: "water-demand-prediction.timeframe.all",
      ...Object.map(
        WaterDemandPrediction2Service.TIMEFRAME_DURATIONS,
        duration => duration.locale(this.lang()).humanize(),
      ),
    })) satisfies Signal<Record<Timeframe, string>>,
    smartmeter: computed(() =>
      Object.map(
        this.meterInformation(),
        (_, key) => `water-demand-prediction.smartmeter.${key}`,
      ),
    ) satisfies Signal<Record<string, string>>,
    startPoint: Object.map(
      WaterDemandPrediction2Service.START_POINTS,
      (_, key) => `water-demand-prediction.start-point.${key}`,
    ) satisfies Record<StartPoint, string>,
    weatherCapability: fromEntries(
      WaterDemandPrediction2Service.WEATHER_CAPABILITIES.map(capability => [
        capability,
        `water-demand-prediction.weather.${capability}`,
      ]),
    ) satisfies Record<WeatherCapability, string>,
    weatherColumn: signals.map(
      this.service.fetchWeatherCols(this.choices.weatherCapability),
      cols => cols ?? {},
    ) satisfies Signal<Record<string, string>>,
  } as const;

  private fetchStartPoint = computed(() => {
    let startPoint = this.choices.startPoint();
    if (!startPoint) return undefined;
    return WaterDemandPrediction2Service.START_POINTS[startPoint];
  });

  protected fetchSmartmeterParams = signals.require({
    startPoint: this.fetchStartPoint,
    name: this.choices.smartmeter,
    timeframe: this.choices.timeframe,
    resolution: this.choices.resolution,
  }) satisfies Parameters<WaterDemandPrediction2Service["fetchSmartmeter"]>[0];

  protected smartmeter = this.service.fetchSmartmeter(
    this.fetchSmartmeterParams,
  );

  protected pushSmartmeterDataset() {
    let smartmeter = this.smartmeter();
    let resolution = this.choices.resolution();
    if (!smartmeter || !resolution) return;

    this.chartDatasets.historic[resolution].push({
      label: `${smartmeter.name}::${smartmeter.timeframe}`,
      data: zip(smartmeter.date, smartmeter.value).map(([date, value]) => ({
        x: date.toISOString(),
        y: value,
      })),
      parsing: false,
      backgroundColor: RgbaColor.fromString(smartmeter.name).toString(),
    });

    this.chartResolution.set(resolution);
  }

  protected clearSmartmeterDataset() {
    let resolution = this.chartResolution();
    if (!resolution) return;
    this.chartDatasets.historic[resolution].clear();
  }

  protected modelParams = signals.require({
    startPoint: this.fetchStartPoint,
    name: this.choices.smartmeter,
    timeframe: this.choices.timeframe,
    resolution: this.choices.resolution,
    weatherCapability: this.choices.weatherCapability,
    weatherColumn: this.choices.weatherColumn,
  }) satisfies Signal<ModelParams | undefined>;

  private trainModelRequest = signals.maybe<ModelParams>({equal: () => false});
  private trainModelResource = this.service.trainModel(this.trainModelRequest);
  protected isTraining = signal<boolean>(false);

  private _isTrainingReset = effect(() => {
    this.trainModelResource();
    setTimeout(
      () => this.isTraining.set(false),
      dayjs.duration(1, "s").asMilliseconds(),
    );
  });

  protected trainModel() {
    let params = this.modelParams();
    if (!params) return;
    this.isTraining.set(true);
    this.trainModelRequest.set(params);
  }

  private predictionRequest = signals.maybe<ModelParams>({equal: () => false});
  private predictionResource = this.service.fetchPrediction(
    this.predictionRequest,
  );

  protected fetchPrediction() {
    let params = this.modelParams();
    if (!params) return;
    this.predictionRequest.set(params);
  }

  private _pushPredictionEffect = effect(() => {
    let prediction = this.predictionResource();
    if (!prediction) return;

    this.chartDatasets.predictions.push({
      label: `${prediction.name}::${prediction.timeframe}`,
      data: zip(prediction.date, prediction.value).map(([date, value]) => ({
        x: date.toISOString(),
        y: value,
      })),
      parsing: false,
      backgroundColor: RgbaColor.fromString(prediction.name).toString(),
    });
  });

  _training = effect(() => console.log(this.trainModelResource()));
  _prediction = effect(() => console.log(this.predictionResource()));

  private storeChoicesEffect = effect(() => {
    let choices = Object.map(this.choices, val => val());
    for (let key of keys(choices)) if (!choices[key]) delete choices[key];
    this.router.navigate([], {
      queryParams: choices,
      queryParamsHandling: "replace",
      replaceUrl: true,
    });
  });

  private loadParam<
    C extends keyof typeof this.choices,
    T extends typeUtils.Signaled<(typeof this.choices)[C]>,
    I extends (input: unknown) => input is T,
  >(params: Params, choice: C, is: I): void {
    let param = params[choice];
    let signal = this.choices[choice] as WritableSignal<T>;
    if (param && is(param)) signal.set(param);
  }

  // prettier-ignore
  ngOnInit() {
    let params = this.route.snapshot.queryParams;
    this.loadParam(params, "resolution", typia.createIs<Resolution>());
    this.loadParam(params, "timeframe", typia.createIs<Timeframe>());
    this.loadParam(params, "smartmeter", typia.createIs<string>());
    this.loadParam(params, "startPoint", typia.createIs<StartPoint>());
    this.loadParam(params, "weatherCapability", typia.createIs<WeatherCapability>());
    this.loadParam(params, "weatherColumn", typia.createIs<string>());
  }

  protected xTicks(
    resolution: Resolution,
    lang: string,
  ): TickOptions["callback"] {
    return (_value, index, ticks) => {
      let date = dayjs(ticks[index].label! as string);

      let format: string;
      switch (resolution) {
        case "hourly":
          format = lang === "de" ? "DD.MM.YYYY HH:mm" : "MM/DD/YYYY HH.mm";
          break;
        case "daily":
          format = lang === "de" ? "DD.MM.YYYY" : "MM/DD/YYYY";
          break;
        case "weekly":
          format = "[W]WW YYYY"; // e.g. "W36 2025"
          break;
        default:
          format = "";
      }

      return date.format(format);
    };
  }

  protected legendLabel(
    _lang: string,
  ): LegendOptions<"bar">["labels"]["generateLabels"] {
    return chart => {
      return Chart.defaults.plugins.legend.labels
        .generateLabels(chart)
        .map(label => {
          // require the lang as a param to force loading this translation
          let [name, timeframe] = label.text.split("::") as [string, Timeframe];
          let translatedTimeframe = this.options.timeframe()[timeframe];
          let translatedName = this.translate.instant(
            "water-demand-prediction.smartmeter." + name,
          );

          label.text = `${translatedName} - ${translatedTimeframe}`;
          return label;
        }) satisfies LegendItem[];
    };
  }
}
