// cspell:ignore pmdarima rmse

import {Injectable} from "@angular/core";
import dayjs, {Dayjs} from "dayjs";
import {Duration} from "dayjs/plugin/duration";
import typia, {tags} from "typia";

import {api} from "../common/api";
import {Id} from "../common/id";

const URL = "/api/pmdarima-prediction" as const;

class SmartMeterId extends Id<string> {}
class ModelId extends Id<string> {}
class TrainingId extends Id<string> {}

@Injectable({
  providedIn: "root",
})
export class PmdArimaPredictionService extends api.service(URL) {
  static readonly SmartMeterId = SmartMeterId;
  static readonly ModelId = ModelId;
  static readonly TrainingId = TrainingId;

  static readonly SUPPORTED_CAPABILITIES = [
    "air_temperature",
    "precipitation",
    "moisture",
  ] as const;

  static readonly START_POINTS = {
    startOfData: dayjs("2021-05-26"),
    startOfJune21: dayjs("2021-06-01"),
    startOfYear22: dayjs("2022-01-01"),
  } as const;

  fetchPrediction(
    modelId: api.RequestSignal<ModelId>,
    params: api.RequestSignal<{
      forecastLength?: Duration;
      interval?: Duration;
    }>,
  ): api.Signal<Self.Prediction> {
    return api.resource({
      url: api.url`${URL}/predict/${modelId}`,
      validateRaw: typia.createValidate<Raw.Prediction>(),
      parse: raw => ({
        ...raw,
        datapoints: raw.datapoints.map(dt => ({
          ...dt,
          time: dayjs(dt.time),
        })),
      }),
      params: api.QueryParams.from(params),
    });
  }

  fetchMeterNames(): api.Signal<Self.SmartMeter[]> {
    return api.resource({
      url: `${URL}/meter-names`,
      validateRaw: typia.createValidate<Raw.SmartMeter[]>(),
      parse: meters =>
        meters.map(({name, id}) => ({name, id: SmartMeterId.of(id)})),
    });
  }

  fetchMeasuredData(
    meterId: api.RequestSignal<SmartMeterId>,
    params: api.RequestSignal<{
      bucketSize?: Duration;
      start?: Dayjs;
      end?: Dayjs;
    }>,
  ): api.Signal<Self.DataPoint[]> {
    return api.resource({
      url: api.url`${URL}/measured-data/${meterId}`,
      validateRaw: typia.createValidate<Raw.DataPoint[]>(),
      parse: dts => dts.map(dt => ({...dt, time: dayjs(dt.time)})),
      params: api.QueryParams.from(params),
    });
  }

  readonly training = {
    start: (
      meterId: api.RequestSignal<SmartMeterId>,
      params: api.RequestSignal<{
        startPoint?: Dayjs;
        timeSpan?: Duration;
        weatherCapability?: Self.SupportedCapability;
        weatherColumnName?: string;
      }>,
    ): api.Signal<{modelId: ModelId; trainingId: TrainingId}> => {
      return api.resource({
        url: api.url`${URL}/training/start/${meterId}`,
        method: "PUT",
        params: api.QueryParams.from(params),
        validateRaw: typia.createValidate<{
          modelId: string;
          trainingId: string;
        }>(),
        parse: ({modelId, trainingId}) => ({
          modelId: ModelId.of(modelId),
          trainingId: TrainingId.of(trainingId),
        }),
      });
    },

    status: (trainingId: TrainingId): api.Socket<string, void> => {
      return api.socket({
        url: `${URL}/training/status/${trainingId}`,
        validate: typia.createValidate<string>(),
      });
    },
  } as const;

  fetchWeatherCapabilities(
    params: api.RequestSignal<{
      start?: Dayjs;
      end?: Dayjs;
      resolution?: "hourly";
    }>,
  ): api.Signal<(Self.WeatherCapability & {columns: never})[]> {
    return api.resource({
      url: `${URL}/weather-capabilities`,
      validateRaw:
        typia.createValidate<(Raw.WeatherCapability & {columns: never})[]>(),
      params: api.QueryParams.from(params),
      parse: capabilities =>
        capabilities.map(capability => ({
          ...capability,
          availableFrom: dayjs(capability.availableFrom),
          availableUntil: dayjs(capability.availableUntil),
        })),
    });
  }

  fetchWeatherColumns(
    params: api.RequestSignal<{
      capability?: Self.SupportedCapability[];
      resolution?: "hourly";
      start?: Dayjs;
      end?: Dayjs;
    }>,
  ): api.Signal<(Self.WeatherCapability & {columns: Self.WeatherColumn[]})[]> {
    return api.resource({
      url: `${URL}/weather-columns`,
      validateRaw:
        typia.createValidate<
          (Raw.WeatherCapability & {columns: Raw.WeatherColumn[]})[]
        >(),
      params: api.QueryParams.from(params),
      parse: capabilities =>
        capabilities.map(capability => ({
          ...capability,
          availableFrom: dayjs(capability.availableFrom),
          availableUntil: dayjs(capability.availableUntil),
          columns: capability.columns.map(column => ({
            ...column,
            forDataFrom: dayjs(column.forDataFrom),
            forDataUntil: dayjs(column.forDataUntil),
          })),
        })),
    });
  }
}

namespace Raw {
  export type DataPoint = api.RawRecord<Self.DataPoint>;

  export type ConfidenceDataPoint = api.RawRecord<Self.ConfidenceDataPoint>;

  export type Prediction = Omit<Self.Prediction, "datapoints"> & {
    datapoints: ConfidenceDataPoint[];
  };

  export type SmartMeter = Omit<Self.SmartMeter, "id"> & {id: string};

  export type WeatherColumn = api.RawRecord<Self.WeatherColumn>;

  export type WeatherCapability = Omit<
    api.RawRecord<Self.WeatherCapability>,
    "columns"
  > & {columns: WeatherColumn[]};
}

export namespace PmdArimaPredictionService {
  export type SmartMeterId = InstanceType<typeof SmartMeterId>;
  export type ModelId = InstanceType<typeof ModelId>;
  export type TrainingId = InstanceType<typeof TrainingId>;

  export type DataPoint = {
    time: Dayjs;
    value: number;
  };

  export type ConfidenceDataPoint = DataPoint & {
    confidenceInterval: [
      number & tags.Type<"double">,
      number & tags.Type<"double">,
    ];
  };

  export type Prediction = {
    madeWithModel: string;
    mae: number & tags.Type<"double">;
    mse: number & tags.Type<"double">;
    rmse: number & tags.Type<"double">;
    r2: number & tags.Type<"double">;
    datapoints: ConfidenceDataPoint[];
  };

  export type SmartMeter = {
    id: SmartMeterId;
    name: string;
  };

  export type SupportedCapability =
    (typeof PmdArimaPredictionService)["SUPPORTED_CAPABILITIES"][number];

  export type WeatherColumn = {
    columnName: string;
    description: string;
    forDataFrom: Dayjs;
    forDataUntil: Dayjs;
  };

  export type WeatherCapability = {
    capability: Self.SupportedCapability;
    availableFrom: Dayjs;
    availableUntil: Dayjs;
    columns?: WeatherColumn[];
    resolution: "hourly";
  };
}

import Self = PmdArimaPredictionService;
