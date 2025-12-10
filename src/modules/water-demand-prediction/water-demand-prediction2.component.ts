import {CommonModule} from "@angular/common";
import {
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
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
import {ChartData, ChartDataset as ChartJsDataset} from "chart.js";
import dayjs from "dayjs";
import {BaseChartDirective} from "ng2-charts";
import {tags} from "typia";

import {WdpChartsViewComponent} from "./views/charts-view/charts-view.component";
import {WdpNewModelViewComponent} from "./views/new-model-view/new-model-view.component";
import {WdpSelectModelViewComponent} from "./views/select-model-view/select-model-view.component";
import {WaterDemandPrediction2Service as Service} from "./water-demand-prediction2.service";
import {PmdArimaPredictionService} from "../../api/pmd-arima-prediction.service";
import {signals} from "../../common/signals";
import {api} from "../../common/api";
import {QueryParamService} from "../../common/services/query-param.service";
import {RgbaColor} from "../../common/utils/rgba-color";

import ModelId = PmdArimaPredictionService.ModelId;
import MeterId = PmdArimaPredictionService.SmartMeterId;
import TrainingId = PmdArimaPredictionService.TrainingId;

import DataPoint = PmdArimaPredictionService.DataPoint;
import Prediction = PmdArimaPredictionService.Prediction;
import {fromEntries} from "../../common/utils/from-entries";

type Group = "historic" | "prediction";

@Component({
  imports: [
    NgIconComponent,
    BaseChartDirective,
    CommonModule,
    WdpChartsViewComponent,
    WdpNewModelViewComponent,
    WdpSelectModelViewComponent,
  ],
  templateUrl: "./water-demand-prediction2.component.html",
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

  protected modelId = this.queryParams.signal(
    "modelId",
    ModelId.queryParamOpts(),
  );
  protected model = this.service.model(this.modelId);

  protected meterId = computed(() => this.model()?.meter);
  protected meter = this.service.meter(this.meterId);

  protected usages = {
    historic: this.predictionService.fetchRecordedUsages(this.meterId, {
      // bucketSize: dayjs.duration(1, "month"),
    }),
    prediction: this.predictionService.fetchPrediction(this.modelId),
  } as const satisfies Record<Group, any>;

  protected data = {
    historic: signals.map<MeterId, DataPoint[]>(),
    prediction: signals.map<ModelId, Prediction>(),
  } as const satisfies Record<Group, any>;

  protected datapoints = {
    historic: this.data.historic satisfies Signal<Map<MeterId, DataPoint[]>>,
    prediction: (() => {
      let entries = this.data.prediction.entries();
      return computed(() => {
        let entriesIter = entries();
        return new Map(
          Array.from(entriesIter).map(([key, val]) => [key, val.datapoints]),
        );
      });
    })() satisfies Signal<Map<ModelId, DataPoint[]>>,
  } as const;

  private loadData = {
    historic: effect(() => {
      let id = untracked(this.meterId);
      let data = this.usages.historic();
      if (id && data) this.data.historic.set(id, data);
    }),
    prediction: effect(() => {
      let id = untracked(this.modelId);
      let data = this.usages.prediction();
      if (id && data) this.data.prediction.set(id, data);
    }),
  } as const;

  protected labels = Object.map(this.datapoints, datapoints =>
    this.service.labels(computed(() => datapoints().values())),
  );

  protected datasets = Object.map(this.datapoints, (datapoints, key) =>
    this.service.datasets(
      this.labels[key],
      computed(() => Object.fromEntries(datapoints())),
    ),
  );
}
