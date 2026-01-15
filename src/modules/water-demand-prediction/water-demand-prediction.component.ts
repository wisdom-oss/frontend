import {CommonModule} from "@angular/common";
import {computed, effect, inject, Component, Signal} from "@angular/core";
import {provideIcons} from "@ng-icons/core";
import {
  remixArrowRightFill,
  remixLoader4Fill,
  remixResetRightLine,
} from "@ng-icons/remixicon";
import typia from "typia";

import {WdpChartsViewComponent} from "./views/charts-view/charts-view.component";
import {WdpNewModelViewComponent} from "./views/new-model-view/new-model-view.component";
import {WdpSelectModelViewComponent} from "./views/select-model-view/select-model-view.component";
import {WaterDemandPrediction2Service as Service} from "./water-demand-prediction.service";
import {PmdArimaPredictionService} from "../../api/pmd-arima-prediction.service";
import {signals} from "../../common/signals";
import {QueryParamService} from "../../common/services/query-param.service";

import ModelId = PmdArimaPredictionService.ModelId;
import MeterId = PmdArimaPredictionService.SmartMeterId;

import DataPoint = PmdArimaPredictionService.DataPoint;
import Prediction = PmdArimaPredictionService.Prediction;

type Group = "historic" | "prediction";

@Component({
  imports: [
    CommonModule,
    WdpChartsViewComponent,
    WdpNewModelViewComponent,
    WdpSelectModelViewComponent,
  ],
  templateUrl: "./water-demand-prediction.component.html",
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
  private predictionService = inject(PmdArimaPredictionService);
  private queryParams = inject(QueryParamService);

  protected lang = signals.lang();
  protected view = this.queryParams.signal<"charts" | "select" | "new">(
    "view",
    {
      serialize: view => view,
      parse: raw => typia.assert<"charts" | "select" | "new">(raw),
    },
  );

  protected modelIds = this.queryParams.signal("model", {
    ...ModelId.queryParamOpts(),
    multi: true,
  });
  protected models = this.service.models(this.modelIds);

  protected meterIds = computed(
    () => new Set(Array.from(this.models().values()).map(model => model.meter)),
  );
  protected meters = this.service.meters(this.meterIds);

  protected usages = {
    historic: signals.map<MeterId, DataPoint[]>(),
    prediction: signals.map<ModelId, Prediction>(),
  } as const satisfies Record<Group, any>;

  private loadHistoricUsages = effect(() => {
    let meterIds = this.meterIds();
    for (let meterId of meterIds) {
      if (this.usages.historic().has(meterId)) continue;
      this.predictionService.fetchRecordedUsages
        .get(meterId)
        .then(data => this.usages.historic.set(meterId, data));
    }
  });

  private loadPredictionUsages = effect(() => {
    let modelIds = this.modelIds();
    for (let modelId of modelIds) {
      if (this.usages.prediction().has(modelId)) continue;
      this.predictionService.fetchPrediction
        .get(modelId)
        .then(data => this.usages.prediction.set(modelId, data));
    }
  });

  protected datapoints = {
    historic: (() => {
      let entriesIter = this.usages.historic.entries();
      let entriesArray = computed(() => Array.from(entriesIter()));
      return computed(() => {
        let meterIds = this.meterIds();
        return new Map(entriesArray().filter(([key]) => meterIds.has(key)));
      });
    })() satisfies Signal<Map<MeterId, DataPoint[]>>,
    prediction: (() => {
      let entriesIter = this.usages.prediction.entries();
      let entriesArray = computed(() => Array.from(entriesIter()));
      return computed(() => {
        let modelIds = this.modelIds();
        return new Map(
          entriesArray()
            .filter(([key]) => modelIds.includes(key))
            .map(([key, val]) => [key, val.datapoints]),
        );
      });
    })() satisfies Signal<Map<ModelId, DataPoint[]>>,
  };

  protected labels = Object.map(this.datapoints, datapoints =>
    this.service.labels(computed(() => datapoints().values())),
  );

  protected datasets = Object.map(this.datapoints, (datapoints, key) =>
    this.service.datasets(
      this.labels[key],
      computed(() => Object.fromEntries(datapoints())),
    ),
  );

  protected addModelId(modelId: ModelId) {
    let modelIds = new Set(this.modelIds());
    modelIds.add(modelId);
    this.modelIds.set(Array.from(modelIds)).then(() => this.view.set("charts"));
  }

  protected clearChart() {
    this.modelIds.set([]).then(() => this.view.set("select"));
  }
}
