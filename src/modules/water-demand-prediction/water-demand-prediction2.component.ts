import {
  computed,
  effect,
  inject,
  signal,
  Component,
  Signal,
} from "@angular/core";
import {TranslateDirective, TranslatePipe} from "@ngx-translate/core";
import dayjs from "dayjs";
import {Duration} from "dayjs/plugin/duration";
import {BaseChartDirective} from "ng2-charts";

import {WaterDemandPrediction2Service} from "../../api/water-demand-prediction2.service";
import {signals} from "../../common/signals";
import {DropdownComponent} from "../../common/components/dropdown/dropdown.component";
import {EmptyPipe} from "../../common/pipes/empty.pipe";
import {fromEntries} from "../../common/utils/from-entries";

type Resolution = WaterDemandPrediction2Service.Resolution;
type Timeframe = WaterDemandPrediction2Service.Timeframe;
type WeatherCapability = WaterDemandPrediction2Service.WeatherCapability;

@Component({
  imports: [
    BaseChartDirective,
    DropdownComponent,
    TranslateDirective,
    TranslatePipe,
    EmptyPipe,
  ],
  templateUrl: "./water-demand-prediction2.component.html",
  styleUrl: "./water-demand-prediction2.component.scss",
})
export class WaterDemandPrediction2Component {
  private service = inject(WaterDemandPrediction2Service);
  private lang = signals.lang();

  private meterInformation = this.service.fetchMeterInformation();

  protected readonly resolutions: Resolution[] = ["hourly", "daily", "weekly"];
  protected chartResolution = signal<Resolution>("daily");

  private readonly timeframes: Record<Exclude<Timeframe, "all">, Duration> = {
    "one day": dayjs.duration(1, "day"),
    "one week": dayjs.duration(1, "week"),
    "one month": dayjs.duration(1, "month"),
    "three months": dayjs.duration(3, "months"),
    "six months": dayjs.duration(6, "months"),
    "one year": dayjs.duration(1, "year"),
  };

  private startPoints = {
    startOfData: dayjs("2021-05-26"),
    startOfJune21: dayjs("2021-06-01"),
    startOfYear22: dayjs("2022-01-01"),
  } as const;

  private weatherCapabilities: WeatherCapability[] = [
    "plain",
    "air_temperature",
    "precipitation",
    "moisture",
  ];

  protected choices = {
    weatherCapability: signal<WeatherCapability | undefined>(undefined),
  };

  protected options = {
    resolution: fromEntries(
      this.resolutions.map(resolution => [
        resolution,
        `water-demand-prediction.resolution.${resolution}`,
      ]),
    ) satisfies Record<Resolution, string>,
    timeframe: computed(() => ({
      all: "water-demand-prediction.timeframe.all",
      ...Object.map(this.timeframes, duration =>
        duration.locale(this.lang()).humanize(),
      ),
    })) satisfies Signal<Record<Timeframe, string>>,
    smartmeter: computed(() =>
      Object.map(
        this.meterInformation(),
        (_, key) => `water-demand-prediction.smartmeter.${key}`,
      ),
    ) satisfies Signal<Record<string, string>>,
    startPoint: Object.map(
      this.startPoints,
      (_, key) => `water-demand-prediction.start-point.${key}`,
    ) satisfies Record<string, string>,
    weatherCapability: fromEntries(
      this.weatherCapabilities.map(capability => [
        capability,
        `water-demand-prediction.weather.${capability}`,
      ]),
    ) satisfies Record<WeatherCapability, string>,
    weatherColumn: signals.map(
      this.service.fetchWeatherCols(this.choices.weatherCapability),
      cols => cols ?? {},
    ) satisfies Signal<Record<string, string>>,
  };

  _ = effect(() => console.log(this.meterInformation()));
}
