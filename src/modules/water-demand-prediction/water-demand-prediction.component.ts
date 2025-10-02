import {formatNumber, NgClass} from "@angular/common";
import {
  computed,
  effect,
  inject,
  signal,
  viewChildren,
  Component,
  OnInit,
  AfterViewInit,
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
  TooltipCallbacks,
  ChartDataset as ChartJsDataset,
  LegendOptions,
  TickOptions,
} from "chart.js";
import {Chart} from "chart.js";
import dayjs, {Dayjs} from "dayjs";
import {BaseChartDirective} from "ng2-charts";
import typia from "typia";

import {LegendItemComponent} from "./legend-item/legend-item.component";
import {WaterDemandPredictionService} from "../../api/water-demand-prediction.service";
import {signals} from "../../common/signals";
import {DropdownComponent} from "../../common/components/dropdown/dropdown.component";
import {EmptyPipe} from "../../common/pipes/empty.pipe";
import {fromEntries} from "../../common/utils/from-entries";
import {RgbaColor} from "../../common/utils/rgba-color";
import {zip} from "../../common/utils/zip";
import {typeUtils} from "../../common/utils/type-utils";
import {keys} from "../../common/utils/keys";
import {api} from "../../common/api";

type Service = WaterDemandPredictionService;
type Resolution = WaterDemandPredictionService.Resolution;
type DataGroup = "historic" | "predictions";
type Timeframe = WaterDemandPredictionService.Timeframe;
type WeatherCapability = WaterDemandPredictionService.WeatherCapability;
type StartPoint = keyof (typeof WaterDemandPredictionService)["START_POINTS"];
type ChartDataset = ChartJsDataset<"bar", {x: string; y: number}[]>;
type FetchSmartmeterParams = Parameters<Service["fetchSmartmeter"]>[0];
type FetchPredictionParams = Parameters<Service["fetchPrediction"]>[0];
type TrainModelParams = Parameters<Service["trainModel"]>[0];
type SingleSmartMeter = WaterDemandPredictionService.SingleSmartmeter;
type PredictedSmartmeter = WaterDemandPredictionService.PredictedSmartmeter;
type LegendItem = typeUtils.UndefinedToOptionals<{
  -readonly [K in keyof LegendItemComponent]: typeUtils.Signaled<
    LegendItemComponent[K]
  >;
}>;

@Component({
  imports: [
    BaseChartDirective,
    DropdownComponent,
    EmptyPipe,
    LegendItemComponent,
    NgIcon,
    TranslateDirective,
    TranslatePipe,
    NgClass,
  ],
  templateUrl: "./water-demand-prediction.component.html",
  styleUrl: "./water-demand-prediction.component.scss",
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
export class WaterDemandPredictionComponent implements OnInit, AfterViewInit {
  protected exampleColor = RgbaColor.LIME;

  protected Service = WaterDemandPredictionService;
  private service = inject(WaterDemandPredictionService);
  private translate = inject(TranslateService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  protected lang = signals.lang();

  protected error = signals.maybe<Partial<api.Error>>();
  protected makeError() {
    this.error.set({
      type: "https://example.com/errors/invalid-credentials",
      status: 401,
      title: "Invalid Authentication Credentials",
      detail:
        "Your access token is missing, expired, or malformed. Please log in again to obtain a valid token.",
      instance: "tag:example.com,2025-10-02:auth-service/req-12345",
      errors: ["Missing 'Authorization' header", "Bearer token not found"],
      host: "api.example.com",
    });
  }

  private charts = viewChildren(BaseChartDirective);
  protected chart = {
    historic: signals.maybe<Chart<"bar">>(),
    predictions: signals.maybe<Chart<"bar">>(),
  } as const satisfies Record<DataGroup, any>;
  ngAfterViewInit() {
    this.chart.historic.set(this.charts()[0].chart);
    this.chart.predictions.set(this.charts()[1].chart);
  }

  private meterInformation = this.service.fetchMeterInformation();

  protected chartResolution = signal<Resolution>("daily");
  protected chartDatasets = {
    historic: {
      hourly: signals.array<ChartDataset>(),
      daily: signals.array<ChartDataset>(),
      weekly: signals.array<ChartDataset>(),
    } satisfies Record<Resolution, any>,
    predictions: {
      hourly: signals.array<ChartDataset>(),
      daily: signals.array<ChartDataset>(),
      weekly: signals.array<ChartDataset>(),
    } satisfies Record<Resolution, any>,
  } as const satisfies Record<DataGroup, any>;

  private makeChartLabels(dataGroup: DataGroup): Signal<string[]> {
    return computed(() => {
      let datasets = this.chartDatasets[dataGroup][this.chartResolution()]();
      let dates = new Set(datasets.flatMap(set => set.data.map(({x}) => x)));
      return Array.from(dates).sort();
    });
  }
  protected chartLabels = {
    historic: this.makeChartLabels("historic"),
    predictions: this.makeChartLabels("predictions"),
  } as const satisfies Record<DataGroup, any>;

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
      WaterDemandPredictionService.RESOLUTIONS.map(resolution => [
        resolution,
        `water-demand-prediction.resolution.${resolution}`,
      ]),
    ) satisfies Record<Resolution, string>,
    timeframe: computed(() => ({
      all: "water-demand-prediction.timeframe.all",
      ...Object.map(
        WaterDemandPredictionService.TIMEFRAME_DURATIONS,
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
      WaterDemandPredictionService.START_POINTS,
      (_, key) => `water-demand-prediction.start-point.${key}`,
    ) satisfies Record<StartPoint, string>,
    weatherCapability: fromEntries(
      WaterDemandPredictionService.WEATHER_CAPABILITIES.map(capability => [
        capability,
        `water-demand-prediction.weather.${capability}`,
      ]),
    ) satisfies Record<WeatherCapability, string>,
    weatherColumn: signals.map(
      this.service.fetchWeatherCols(this.choices.weatherCapability),
      cols => cols ?? {},
    ) satisfies Signal<Record<string, string>>,
  } as const;

  private plainWeatherColumnEffect = effect(() => {
    if (this.choices.weatherCapability() == "plain") {
      this.choices.weatherColumn.set("");
    }
  });

  private fetchStartPoint = computed(() => {
    let startPoint = this.choices.startPoint();
    if (!startPoint) return undefined;
    return WaterDemandPredictionService.START_POINTS[startPoint];
  });

  private historicModelParams = {
    startPoint: this.fetchStartPoint,
    name: this.choices.smartmeter,
    timeframe: this.choices.timeframe,
    resolution: this.choices.resolution,
  } as const;

  private predictionModelParams = {
    ...this.historicModelParams,
    weatherCapability: this.choices.weatherCapability,
    weatherColumn: this.choices.weatherColumn,
  } as const;

  protected params = {
    historic: signals.require(
      this.historicModelParams,
    ) satisfies FetchSmartmeterParams,
    predictions: signals.require(
      this.predictionModelParams,
    ) satisfies FetchPredictionParams satisfies TrainModelParams,
  } as const satisfies Record<DataGroup, any>;

  private predictionRetry = signals.trigger();

  protected fetched = {
    historic: this.service.fetchSmartmeter(this.params.historic),
    predictions: this.service.fetchPrediction(
      computed(
        () => {
          this.predictionRetry(); // try again after training is done
          return this.params.predictions();
        },
        {equal: () => false},
      ),
    ),
  } as const satisfies Record<DataGroup, any>;

  private dataGroupIter(dataGroup?: DataGroup): Iterable<DataGroup> {
    return dataGroup ? [dataGroup] : ["historic", "predictions"];
  }

  protected pushSmartmeterDataset(dataGroup?: DataGroup) {
    for (let group of this.dataGroupIter(dataGroup)) {
      let fetched = this.fetched[group]() as
        | (SingleSmartMeter & PredictedSmartmeter)
        | undefined;
      if (!fetched) continue;

      let color = RgbaColor.fromString(fetched.name);
      this.chartDatasets[group][fetched.resolution].push({
        label: JSON.stringify({
          color,
          smartmeter: fetched.name,
          resolution: fetched.resolution,
          mae: fetched.meanAbsoluteError,
          rmse: fetched.rootOfMeanSquaredError,
          mse: fetched.meanSquaredError,
          r2: fetched.r2,
        } satisfies LegendItem),
        data: zip(fetched.date, fetched.value).map(([date, value]) => ({
          x: date.toISOString(),
          y: value,
        })),
        parsing: false,
        backgroundColor: color.toString(),
      });

      this.chartResolution.set(fetched.resolution);
    }
  }

  protected clearSmartmeterDatasets(dataGroup?: DataGroup) {
    let resolution = this.chartResolution();
    if (!resolution) return;

    for (let group of this.dataGroupIter(dataGroup)) {
      this.chartDatasets[group][resolution].clear();
    }
  }

  private trainModelRequest = signals.maybe<
    typeUtils.Signaled<TrainModelParams>
  >({equal: () => false});
  private trainModelResource = this.service.trainModel(this.trainModelRequest);
  protected isTraining = signal<boolean>(false);

  private isTrainingResetEffect = effect(() => {
    let res = this.trainModelResource();
    if (!res) return;
    setTimeout(
      () => this.isTraining.set(false),
      dayjs.duration(1, "s").asMilliseconds(),
    );
  });

  private fetchPredictionAfterTrainingEffect = effect(() => {
    let res = this.trainModelResource();
    if (!res) return;
    this.predictionRetry.trigger();
  });

  protected trainModel() {
    let params = this.params.predictions();
    if (!params) return;
    this.isTraining.set(true);
    this.trainModelRequest.set(params);
  }

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

  private parseLegendItem(json: string): LegendItem {
    let reviver = (key: string, value: any) => {
      if (key == "color") return RgbaColor.reviver(key, value);
      return value;
    };

    return typia.assert<LegendItem>(JSON.parse(json, reviver));
  }

  private makeLegendItems(dataGroup: DataGroup): Signal<LegendItem[]> {
    return computed(() => {
      let chart = this.chart[dataGroup]();
      if (!chart) return [];
      let resolution = this.chartResolution();
      let datasets = this.chartDatasets[dataGroup][resolution]();

      return datasets.map(dataset => {
        let label = dataset.label;
        if (!label) throw new Error("missing label");
        return this.parseLegendItem(label);
      });
    });
  }

  protected legendItems = {
    historic: this.makeLegendItems("historic"),
    predictions: this.makeLegendItems("predictions"),
  } as const satisfies Record<DataGroup, any>;

  private formatDate(date: Dayjs, resolution: Resolution, lang: "en" | "de") {
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

    return date.locale(lang).format(format);
  }

  protected xTicks(
    resolution: Resolution,
    lang: "en" | "de",
  ): TickOptions["callback"] {
    return (_value, index, ticks) => {
      let date = dayjs(ticks[index].label! as string);
      return this.formatDate(date, resolution, lang);
    };
  }

  protected yTicks(lang: "en" | "de"): TickOptions["callback"] {
    return (value, _index, _ticks) => {
      return formatNumber(value as number, lang, "1.1");
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
        }); // satisfies LegendItem[];
    };
  }

  protected tooltipTitle: TooltipCallbacks<"bar">["title"] = tooltipItems => {
    let date = dayjs(tooltipItems[0].label);
    let resolution = this.chartResolution();
    let lang = this.lang();
    let formattedDate = this.formatDate(date, resolution, lang);

    let data = tooltipItems[0].dataset.data[
      tooltipItems[0].dataIndex
    ] as unknown as {x: string; y: number};
    let formattedValue = formatNumber(data.y, lang);

    return `${formattedValue} m³ - ${formattedDate}`;
  };

  protected tooltipLabel: TooltipCallbacks<"bar">["label"] = tooltipItem => {
    if (!tooltipItem.dataset.label) return;
    let {smartmeter, resolution} = this.parseLegendItem(
      tooltipItem.dataset.label,
    );
    let translatedName = this.translate.instant(
      `water-demand-prediction.smartmeter.${smartmeter}`,
    );
    let translatedResolution = this.translate.instant(
      `water-demand-prediction.resolution.${resolution}`,
    );
    return `${translatedName} - ${translatedResolution}`;
  };
}
