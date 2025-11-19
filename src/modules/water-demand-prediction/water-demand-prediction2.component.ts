import {
  computed,
  effect,
  inject,
  signal,
  Component,
  Signal,
} from "@angular/core";
import {provideIcons, NgIconComponent} from "@ng-icons/core";
import {remixResetRightLine} from "@ng-icons/remixicon";
import dayjs from "dayjs";

import {PmdArimaPredictionService as Service} from "../../api/pmd-arima-prediction.service";
import {signals} from "../../common/signals";
import {api} from "../../common/api";
import {QueryParamService} from "../../common/services/query-param.service";

function makeMap<K, V>(
  signal: api.Signal<V[]>,
  key: (value: V) => K,
): Signal<Map<K, V>> & {reload(): boolean} {
  let map = new Map();
  let s = computed(
    () => {
      let values = signal();
      map.clear();
      for (let value of values ?? []) map.set(key(value), value);
      return map;
    },
    {equal: () => false},
  );
  return Object.assign(s, {reload: () => signal.reload()});
}

@Component({
  imports: [NgIconComponent],
  templateUrl: "./water-demand-prediction2.component.html",
  providers: [
    provideIcons({
      remixResetRightLine,
    }),
  ],
})
export class WaterDemandPrediction2Component {
  private service = inject(Service);
  private queryParams = inject(QueryParamService);

  protected lang = signals.lang();

  private fetchModels = this.service.fetchModels();

  protected models = makeMap(this.fetchModels, m => m.modelId);
  protected meters = makeMap(this.service.fetchMeters(), m => m.id);

  protected modelId = this.queryParams.signal("modelId", {
    parse: raw => Service.ModelId.of(raw),
    serialize: id => id.toString(),
  });

  protected model = computed(() => {
    let models = this.models();
    let modelId = this.modelId();
    if (!modelId) return undefined;
    return models.get(modelId);
  });

  protected modelsLoading = signal(true);
  private modelsDelayed = signals.delay(this.models, dayjs.duration(0.8, "s"));
  private modelsLoaded = effect(() => {
    let models = this.modelsDelayed();
    if (!models) return;
    this.modelsLoading.set(false);
  });

  _models = effect(() => console.log(this.models()));
  _meters = effect(() => console.log(this.meters()));
}
