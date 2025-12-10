import {computed, inject, Injectable, Signal} from "@angular/core";
import {ChartDataset} from "chart.js";
import {tags} from "typia";

import {PmdArimaPredictionService} from "../../api/pmd-arima-prediction.service";
import {api} from "../../common/api";
import {RgbaColor} from "../../common/utils/rgba-color";

import ModelId = PmdArimaPredictionService.ModelId;
import MeterId = PmdArimaPredictionService.SmartMeterId;
import {compute} from "three/src/nodes/TSL.js";

type DateTimeString = string & tags.Format<"date-time">;

@Injectable({
  providedIn: "root",
})
export class WaterDemandPrediction2Service {
  private service = inject(PmdArimaPredictionService);

  readonly availableModels = makeMap(this.service.fetchModels(), m => m.id);
  readonly availableMeters = makeMap(this.service.fetchMeters(), m => m.id);

  models(
    modelIds: Signal<Iterable<ModelId>>,
  ): Signal<Map<ModelId, PmdArimaPredictionService.ModelMetaData>> {
    return computed(() => {
      let models = this.availableModels();
      if (!models) return new Map();
      let ids = modelIds();

      let selected = new Map();
      for (let id of ids) {
        let model = models.get(id);
        if (!model) continue;
        selected.set(id, model);
      }

      return selected;
    });
  }

  model(
    modelId: Signal<ModelId | undefined>,
  ): Signal<PmdArimaPredictionService.ModelMetaData | undefined> {
    return computed(() => {
      let models = this.availableModels();
      let id = modelId();
      if (!models || !id) return;
      let model = models.get(id);
      console.log({models, id, model});
      return model;
      // return models.get(id);
    });
  }

  meter(
    meterId: Signal<MeterId | undefined>,
  ): Signal<PmdArimaPredictionService.SmartMeter | undefined> {
    return computed(() => {
      let meters = this.availableMeters();
      let id = meterId();
      if (!meters || !id) return;
      return meters.get(id);
    });
  }

  meters(
    meterIds: Signal<Iterable<MeterId>>,
  ): Signal<Map<MeterId, PmdArimaPredictionService.SmartMeter>> {
    return computed(() => {
      let meters = this.availableMeters();
      if (!meters) return new Map();
      let ids = meterIds();

      let selected = new Map();
      for (let id of ids) {
        let meter = meters.get(id);
        if (!meter) continue;
        selected.set(id, meter);
      }

      return selected;
    });
  }

  labels(
    chunks: Signal<Iterable<PmdArimaPredictionService.DataPoint[]>>,
  ): Signal<DateTimeString[]> {
    return computed(() => {
      let set = new Set<DateTimeString>();
      for (let datapoints of chunks()) {
        for (let datapoint of datapoints) {
          set.add(datapoint.time.toISOString());
        }
      }
      return Array.from(set).sort();
    });
  }

  datasets(
    labelsSignal: Signal<DateTimeString[]>,
    dataSignal: Signal<
      Record<
        string,
        (PmdArimaPredictionService.DataPoint &
          Partial<PmdArimaPredictionService.ConfidenceDataPoint>)[]
      >
    >,
  ): Signal<
    ChartDataset<
      "bar",
      {x: DateTimeString; y?: number; yMin?: number; yMax?: number}[]
    >[]
  > {
    return computed(() => {
      let labels = labelsSignal();
      let data = dataSignal();
      if (!labels || !data) return [];

      let datasets = [];
      for (let [id, datapoints] of Object.entries(data)) {
        let entries = datapoints.map(point => ({
          x: point.time.toISOString() as DateTimeString,
          y: point.value,
          yMin: point.confidenceInterval?.[0],
          yMax: point.confidenceInterval?.[1],
        }));
        let map = new Map(entries.map(entry => [entry.x, entry]));
        let data = labels.map(label => ({x: label, ...map.get(label)}));
        datasets.push({
          label: id,
          backgroundColor: RgbaColor.fromString(id).toHex(),
          data,
        } satisfies ChartDataset<
          "bar",
          {x: DateTimeString; y?: number; yMin?: number; yMax?: number}[]
        >);
      }

      return datasets;
    });
  }
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
