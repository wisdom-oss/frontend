import {CommonModule} from "@angular/common";
import {
  computed,
  effect,
  inject,
  input,
  signal,
  ViewChild,
  Component,
  Directive,
  TemplateRef,
  Signal,
} from "@angular/core";
import {provideIcons, NgIconComponent} from "@ng-icons/core";
import {
  remixArrowRightFill,
  remixLoader4Fill,
  remixResetRightLine,
} from "@ng-icons/remixicon";
import {ChartDataset as ChartJsDataset} from "chart.js";
import dayjs from "dayjs";
import {BaseChartDirective} from "ng2-charts";
import {tags} from "typia";

import {PmdArimaPredictionService as Service} from "../../api/pmd-arima-prediction.service";
import {signals} from "../../common/signals";
import {api} from "../../common/api";
import {QueryParamService} from "../../common/services/query-param.service";

type ChartDataset = ChartJsDataset<
  "bar",
  {x: string & tags.Format<"date-time">; y: number}[]
>;

@Directive({selector: "ng-template[modelTable]"})
export class ModelTableNgTemplate {
  static ngTemplateContextGuard(
    directive: ModelTableNgTemplate,
    context: unknown,
  ): context is {
    $implicit: {model?: Service.ModelMetaData; meter?: Service.SmartMeter};
  } {
    return true;
  }
}

@Component({
  imports: [
    NgIconComponent,
    BaseChartDirective,
    CommonModule,
    ModelTableNgTemplate,
  ],
  templateUrl: "./water-demand-prediction2.component.html",
  styleUrl: "./water-demand-prediction2.component.scss",
  providers: [
    provideIcons({
      remixResetRightLine,
      remixArrowRightFill,
      remixLoader4Fill,
    }),
  ],
})
export class WaterDemandPrediction2Component {
  private service = inject(Service);
  private queryParams = inject(QueryParamService);

  protected lang = signals.lang();

  protected models = makeMap(this.service.fetchModels(), m => m.id);
  protected meters = makeMap(this.service.fetchMeters(), m => m.id);

  protected modelId = this.queryParams.signal("modelId", {
    parse: raw => Service.ModelId.of(raw),
    serialize: id => id.toString(),
  });

  protected model = computed(() => {
    let models = this.models();
    let modelId = this.modelId();
    if (!models || !modelId) return undefined;
    return models.get(modelId);
  });

  protected modelsLoading = signal(true);
  private modelsDelayed = signals.delay(this.models, dayjs.duration(0.8, "s"));
  private modelsLoaded = effect(() => {
    let models = this.modelsDelayed();
    if (!models) return;
    this.modelsLoading.set(false);
  });

  protected meter = computed(() => {
    let meterId = this.model()?.meter;
    let meters = this.meters();
    if (!meters || !meterId) return undefined;
    return meters.get(meterId);
  });

  protected recordedUsages = this.service.fetchRecordedUsages(
    computed(() => this.model()?.meter),
  );

  protected historicDatasetMap = signals.map();
  protected historicDatasets = signals.mapTo(
    this.historicDatasetMap.values(),
    Array.from,
  ) as Signal<ChartDataset[]>;
  private loadHistoricDatasets = effect(() => {
    let meterId = this.model()?.meter;
    let recordedUsages = this.recordedUsages();
    if (!meterId || !recordedUsages) return;
    this.historicDatasetMap.set(meterId, {
      data: recordedUsages.map(({time, value}) => ({
        x: time.toISOString(),
        y: value,
      })),
    } satisfies ChartDataset);
  });
  protected historicLabels = computed(() => {
    let set = new Set();
    let datasets = this.historicDatasets();
    for (let dataset of datasets) {
      for (let {x} of dataset.data) {
        set.add(x);
      }
    }
    return Array.from(set).sort();
  });

  protected prediction = this.service.fetchPrediction(this.modelId);

  protected predictionDatasetMap = signals.map();
  protected predictionDatasets = signals.mapTo(
    this.predictionDatasetMap.values(),
    Array.from,
  ) as Signal<ChartDataset[]>;
  private loadPredictionDatasets = effect(() => {
    let prediction = this.prediction();
    if (!prediction) return;
    this.predictionDatasetMap.set(prediction.madeWithModel, {
      data: prediction.datapoints.map(({time, value}) => ({
        x: time.toISOString(),
        y: value,
      })),
    } satisfies ChartDataset);
  });
  protected predictionLabels = computed(() => {
    let set = new Set();
    let datasets = this.predictionDatasets();
    for (let dataset of datasets) {
      for (let {x} of dataset.data) {
        set.add(x);
      }
    }
    return Array.from(set).sort();
  });

  _models = effect(() => console.log(this.models()));
  _meters = effect(() => console.log(this.meters()));
  _recordedUsages = effect(() => console.log(this.recordedUsages()));
  _prediction = effect(() => console.log(this.prediction()));
  _historicDatasets = effect(() => console.log(this.historicDatasetMap()));
}

function makeMap<K, V>(
  signal: api.Signal<V[]>,
  key: (value: V) => K,
): Signal<Map<K, V> | undefined> & {reload(): boolean} {
  let map = new Map();
  let s = computed(
    () => {
      let values = signal();
      map.clear();
      if (!values) return;
      for (let value of values) map.set(key(value), value);
      return map;
    },
    {equal: () => false},
  );
  return Object.assign(s, {reload: () => signal.reload()});
}
