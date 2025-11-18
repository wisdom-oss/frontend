import {effect, inject, Component, Signal, computed} from "@angular/core";
import {provideIcons, NgIconComponent} from "@ng-icons/core";
import {remixAiGenerate} from "@ng-icons/remixicon";

import {PmdArimaPredictionService} from "../../api/pmd-arima-prediction.service";
import { signals } from "../../common/signals";
import { api } from "../../common/api";
import { equal } from "three/src/nodes/TSL.js";

function makeMap<K, V>(signal: api.Signal<V[]>, key: (value: V) => K): Signal<Map<K, V>> & {reload(): boolean} {
  let map = new Map();
  let s = computed(() => {
    let values = signal();
    map.clear();
    for (let value of values ?? []) map.set(key(value), value);
    return map;
  }, {equal: () => false});
  return Object.assign(s, {reload: () => signal.reload()});
}

@Component({
  imports: [NgIconComponent],
  templateUrl: "./water-demand-prediction2.component.html",
  providers: [
    provideIcons({
      remixAiGenerate,
    }),
  ],
})
export class WaterDemandPrediction2Component {
  private service = inject(PmdArimaPredictionService);

  protected models = makeMap(this.service.fetchModels(), m => m.modelId);
  protected meters = makeMap(this.service.fetchMeters(), m => m.id);

  _something = effect(() => {
    for (let [modelId, model] of this.models()) {
      console.log(this.meters().get(model.modelId));
    }
  });

  _models = effect(() => console.log(this.models()));
  _meters = effect(() => console.log(this.meters()));
}
