import {
  computed,
  effect,
  inject,
  signal,
  Component,
  Signal,
} from "@angular/core";
import {provideIcons, NgIcon} from "@ng-icons/core";
import {
  remixArrowUpDoubleFill,
  remixDeleteBin2Line,
  remixPingPongLine,
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

import {WaterDemandPrediction2Service} from "../../api/water-demand-prediction2.service";
import {signals} from "../../common/signals";
import {DropdownComponent} from "../../common/components/dropdown/dropdown.component";
import {EmptyPipe} from "../../common/pipes/empty.pipe";
import {fromEntries} from "../../common/utils/from-entries";
import {RgbaColor} from "../../common/utils/rgba-color";
import {zip} from "../../common/utils/zip";

type Resolution = WaterDemandPrediction2Service.Resolution;
type Timeframe = WaterDemandPrediction2Service.Timeframe;
type WeatherCapability = WaterDemandPrediction2Service.WeatherCapability;
type StartPoint = keyof (typeof WaterDemandPrediction2Service)["START_POINTS"];
type ChartDataset = ChartJsDataset<"bar", {x: string; y: number}[]>;

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
      remixArrowUpDoubleFill,
      remixDeleteBin2Line,
      remixPingPongLine,
    }),
  ],
})
export class WaterDemandPrediction2Component {
  protected Service = WaterDemandPrediction2Service;
  private service = inject(WaterDemandPrediction2Service);
  private translate = inject(TranslateService);
  protected lang = signals.lang();

  private meterInformation = this.service.fetchMeterInformation();

  protected chartResolution = signal<Resolution>("daily");
  protected chartDatasets = {
    historic: {
      hourly: signals.array<ChartDataset>(),
      daily: signals.array<ChartDataset>(),
      weekly: signals.array<ChartDataset>(),
    } satisfies Record<Resolution, any>,
  } as const;
  protected chartLabels = computed(() => {
    let resolution = this.chartResolution();
    let datasets = this.chartDatasets.historic[resolution]();
    let dates = new Set(
      datasets.flatMap(dataset => dataset.data.map(data => data.x)),
    );
    return Array.from(dates).sort();
  });

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
      backgroundColor: RgbaColor.fromString(smartmeter.name)
        .toString(),
    });

    this.chartResolution.set(resolution);
  }

  protected clearSmartmeterDataset() {
    let resolution = this.chartResolution();
    if (!resolution) return;
    this.chartDatasets.historic[resolution].clear();
  }

  _ = effect(() =>
    console.log(this.chartDatasets.historic[this.chartResolution()]()),
  );

  protected xTicks(
    resolution: Resolution,
    lang: string,
  ): TickOptions["callback"] {
    return (_value, index, _ticks) => {
      let labels = this.chartLabels();
      let date = dayjs(labels[index]);

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
