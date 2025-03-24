import {NgIf, NgForOf, TitleCasePipe, KeyValuePipe} from "@angular/common";
import {computed, resource, signal, viewChild, Component} from "@angular/core";
import {ReactiveFormsModule} from "@angular/forms";
import {ActivatedRoute} from "@angular/router";
import {provideIcons, NgIcon} from "@ng-icons/core";
import {remixBarChartBoxAiLine} from "@ng-icons/remixicon";
import {ScriptableContext, ChartDataset, ChartOptions} from "chart.js";
import {BaseChartDirective} from "ng2-charts";

import {UsageForecastsService} from "../../../../api/usage-forecasts.service";
import {GeoDataService} from "../../../../api/geo-data.service";
import {signals} from "../../../../common/signals";
import {EmptyPipe} from "../../../../common/pipes/empty.pipe";
import {RgbaColor} from "../../../../common/utils/rgba-color";

type ChartDatasets = ChartDataset<"bar", {x: string; y: number}[]>[];

@Component({
  imports: [
    EmptyPipe,
    KeyValuePipe,
    NgForOf,
    NgIcon,
    NgIf,
    ReactiveFormsModule,
    TitleCasePipe,
    BaseChartDirective,
  ],
  templateUrl: "./result-data-view.component.html",
  styles: ``,
  providers: [
    provideIcons({
      remixBarChartBoxAiLine,
    }),
  ],
})
export class ResultDataViewComponent {
  protected keys: string[];

  protected availableAlgorithms;
  protected selectedAlgorithmIdentifier = signals.formControl("exponential");
  protected selectedAlgorithm = computed(() => {
    let available = this.availableAlgorithms() ?? [];
    let id = this.selectedAlgorithmIdentifier();
    return available.find(algo => algo.identifier == id);
  });

  protected parameters: Record<string, Record<string, any>> = {};

  protected forecastResult = signal<undefined | UsageForecastsService.Result>(
    undefined,
  );
  protected datasets = resource({
    request: () => this.forecastResult(),
    loader: ({request: result}) => this.formatDatasets(result),
  });

  private chart = viewChild(BaseChartDirective);
  protected highlights = new Set<number>();

  constructor(
    private service: UsageForecastsService,
    route: ActivatedRoute,
    private geoDataService: GeoDataService,
  ) {
    this.availableAlgorithms = signals.fromPromise(
      service.fetchAvailableAlgorithms(),
    );

    this.keys = route.snapshot.queryParams["key"]!; // ensured by query params guard
    this.fetchForecast();
  }

  protected async fetchForecast() {
    let algorithm = this.selectedAlgorithmIdentifier();
    // we need to set the value here instead of using signals.fromPromise to
    // not break reactivity detection
    this.forecastResult.set(undefined);
    let result = await this.service.fetchForecast(algorithm, this.keys);
    this.forecastResult.set(result);
  }

  private async formatDatasets(
    result?: UsageForecastsService.Result,
  ): Promise<ChartDatasets> {
    if (!result) return [];

    let labels = new Set<string>();
    for (let date of result.data) labels.add(date.label);
    let identities = await this.geoDataService.identify(labels);
    let names: Record<string, string | null> = {};
    for (let [key, entry] of Object.entries(identities["nds_municipals"])) {
      names[key] = entry.name;
    }

    let datasets: Record<string, ChartDatasets[0]> = {};
    for (let date of result.data) {
      let isForecast = (ctx: ScriptableContext<"bar">) => {
        let realUntil = result.meta.realDataUntil[date.label];
        let x = +(ctx.raw as {x: string; y: number}).x;
        return x > realUntil;
      };

      if (!datasets[date.label])
        datasets[date.label] = {
          label: names[date.label] ?? undefined,
          backgroundColor: ctx => {
            if (this.highlights.has(ctx.datasetIndex))
              return CHART_COLORS.highlight;
            if (isForecast(ctx)) return CHART_COLORS.forecast;
            return CHART_COLORS.history;
          },
          hoverBackgroundColor: ctx => {
            if (this.highlights.has(ctx.datasetIndex))
              return CHART_COLORS.hover.highlight;
            if (isForecast(ctx)) return CHART_COLORS.hover.forecast;
            return CHART_COLORS.hover.history;
          },
          data: [],
        };

      datasets[date.label].data.push({x: "" + date.x, y: date.y});
    }

    return Object.values(datasets);
  }

  protected onChartClick: ChartOptions<"bar">["onClick"] = (
    _event,
    elements,
    _chart,
  ) => {
    for (let {datasetIndex} of elements) {
      let isHighlighted = this.highlights.has(datasetIndex);
      if (isHighlighted) this.highlights.delete(datasetIndex);
      else this.highlights.add(datasetIndex);
      this.chart()?.chart?.update();
    }
  };
}

const HISTORIC_DATA_COLOR = new RgbaColor(62, 120, 178, 0.4);
const FORECAST_DATA_COLOR = new RgbaColor(238, 66, 102, 0.4);
const HIGHLIGHT_DATA_COLOR = new RgbaColor(255, 69, 0, 0.8);

const CHART_COLORS = {
  history: HISTORIC_DATA_COLOR.toString(),
  forecast: FORECAST_DATA_COLOR.toString(),
  highlight: HIGHLIGHT_DATA_COLOR.toString(),

  hover: {
    history: HISTORIC_DATA_COLOR.with("alpha", 1).toString(),
    forecast: FORECAST_DATA_COLOR.with("alpha", 1).toString(),
    highlight: HIGHLIGHT_DATA_COLOR.with("alpha", 1).toString(),
  },
};
