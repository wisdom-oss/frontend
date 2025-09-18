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

type Service = WaterDemandPrediction2Service;
type Resolution = WaterDemandPrediction2Service.Resolution;
type DataGroup = "historic" | "predictions";
type Timeframe = WaterDemandPrediction2Service.Timeframe;
type WeatherCapability = WaterDemandPrediction2Service.WeatherCapability;
type StartPoint = keyof (typeof WaterDemandPrediction2Service)["START_POINTS"];
type ChartDataset = ChartJsDataset<"bar", {x: string; y: number}[]>;
type FetchSmartmeterParams = Parameters<Service["fetchSmartmeter"]>[0];
type FetchPredictionParams = Parameters<Service["fetchPrediction"]>[0];
type TrainModelParams = Parameters<Service["trainModel"]>[0];

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
      let fetched = this.fetched[group]();
      if (!fetched) continue;

      this.chartDatasets[group][fetched.resolution].push({
        label: `${fetched.name}::${fetched.timeframe}`,
        data: zip(fetched.date, fetched.value).map(([date, value]) => ({
          x: date.toISOString(),
          y: value,
        })),
        parsing: false,
        backgroundColor: RgbaColor.fromString(fetched.name).toString(),
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

  private _isTrainingResetEffect = effect(() => {
    let res = this.trainModelResource();
    if (!res) return;
    setTimeout(
      () => this.isTraining.set(false),
      dayjs.duration(1, "s").asMilliseconds(),
    );
  });

  private _fetchPredictionAfterTrainingEffect = effect(() => {
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

  _training = effect(() => console.log(this.trainModelResource()));
  _predictions = effect(() => console.log(this.fetched.predictions()));

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
