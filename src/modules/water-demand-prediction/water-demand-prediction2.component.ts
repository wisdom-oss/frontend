import {
  computed,
  effect,
  inject,
  signal,
  Component,
  Signal,
} from "@angular/core";
import {provideIcons, NgIconComponent} from "@ng-icons/core";
import {
  remixArrowRightFill,
  remixLoader4Fill,
  remixResetRightLine,
} from "@ng-icons/remixicon";
import dayjs from "dayjs";
import {BaseChartDirective} from "ng2-charts";

import {PmdArimaPredictionService as Service} from "../../api/pmd-arima-prediction.service";
import {signals} from "../../common/signals";
import {api} from "../../common/api";
import {QueryParamService} from "../../common/services/query-param.service";

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

@Component({
  imports: [NgIconComponent, BaseChartDirective],
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

  protected models = makeMap(this.service.fetchModels(), m => m.modelId);
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

  protected recordedUsages = this.service.fetchRecordedUsages(
    computed(() => this.model()?.meterId),
  );

  protected prediction = this.service.fetchPrediction(this.modelId);

  _models = effect(() => console.log(this.models()));
  _meters = effect(() => console.log(this.meters()));
  _recordedUsages = effect(() => console.log(this.recordedUsages()));
  _prediction = effect(() => console.log(this.prediction()));
}
