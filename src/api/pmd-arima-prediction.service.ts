// cspell:ignore pmdarima rmse

import {inject, Injectable} from "@angular/core";
import dayjs, {Dayjs} from "dayjs";
import {Duration} from "dayjs/plugin/duration";
import typia, {tags} from "typia";

import {api} from "../common/api";
import {Id} from "../common/id";

const URL = "/api/pmdarima-predictions" as const;

const SMART_METER = Symbol();
class SmartMeterId extends Id<
  string & tags.Format<"uuid">,
  typeof SMART_METER
> {}

const MODEL = Symbol();
class ModelId extends Id<string & tags.Format<"uuid">, typeof MODEL> {}

const TRAINING = Symbol();
class TrainingId extends Id<string, typeof TRAINING> {}

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

  private http = inject(HttpClient);

  // TODO: implement this nicer using api.endpoint, when done
  fetchPrediction: api.Endpoint<
    [
      api.RequestSignal<ModelId>,
      api.RequestSignal<{
        forecastLength?: Duration;
        interval?: Duration;
      }>?,
    ],
    Self.Prediction
  > = (() => {
    let validateRaw = typia.createValidate<Raw.Prediction>();
    let parse = (raw: Raw.Prediction) => ({
      ...raw,
      madeWithModel: ModelId.of(raw.madeWithModel),
      datapoints: raw.datapoints.map(dt => ({
        ...dt,
        time: dayjs(dt.time),
      })),
    });
    let cache = dayjs.duration(7, "days");
    return Object.assign(
      (
        modelId: api.RequestSignal<ModelId>,
        params?: api.RequestSignal<{
          forecastLength?: Duration;
          interval?: Duration;
        }>,
      ): api.Signal<Self.Prediction> =>
        api.resource({
          url: api.url`${URL}/predict/${modelId}`,
          validateRaw,
          parse,
          params: api.QueryParams.from(params ?? {}),
          cache,
        }),
      {
        get: (
          modelId: ModelId,
          params?: {forecastLength?: Duration; interval?: Duration},
        ): Promise<Self.Prediction> => {
          let url = `${URL}/predict/${modelId}`;
          let res = firstValueFrom(
            this.http.get<unknown>(url, {
              params: api.QueryParams.from(params ?? {}).toHttpParams(),
            }),
          );
          return res
            .then(res => typia.assert<Raw.Prediction>(res))
            .then(raw => parse(raw));
        },
      },
    );
  })();

  fetchMeters(): api.Signal<Self.SmartMeter[]> {
    return api.resource({
      url: `${URL}/meters`,
      validateRaw: typia.createValidate<Raw.SmartMeter[]>(),
      parse: meters =>
        meters.map(({name, id}) => ({name, id: SmartMeterId.of(id)})),
    });
  }

  fetchModels(): api.Signal<Self.ModelMetaData[]> {
    return api.resource({
      url: `${URL}/models`,
      validateRaw: typia.createValidate<Raw.ModelMetaData[]>(),
      parse: list =>
        list.map(
          item =>
            ({
              id: ModelId.of(item.id),
              meter: SmartMeterId.of(item.meter),
              hash: item.hash,
              dataStartsAt: dayjs(item.dataStartsAt),
              dataEndsAt: dayjs(item.dataEndsAt),
              weatherCapability: item.weatherCapability ?? undefined,
              capabilityColumn: item.capabilityColumn ?? undefined,
              trainingDuration: item.trainingDuration
                ? dayjs.duration(item.trainingDuration)
                : undefined,
              trainingStart: dayjs(item.trainingStart),
              comment: item.comment ?? undefined,
            }) satisfies Self.ModelMetaData,
        ),
    });
  }

  _fetchRecordedUsages = api.endpoint(
    this.http,
    (
      meterId: api.RequestSignal<SmartMeterId>,
      params?: api.RequestSignal<{
        bucketSize?: Duration;
        start?: Dayjs;
        end?: Dayjs;
      }>,
    ) => ({
      url: api.url`${URL}/meters/${meterId}/recorded-usages`,
      validateRaw: typia.createValidate<Raw.DataPoint[]>(),
      parse: dts => dts.map(dt => ({...dt, time: dayjs(dt.time)})),
      params: api.QueryParams.from(params ?? {}),
      cache: dayjs.duration(1, "day"),
    }),
  );

  fetchRecordedUsages(
    meterId: api.RequestSignal<SmartMeterId>,
    params?: api.RequestSignal<{
      bucketSize?: Duration;
      start?: Dayjs;
      end?: Dayjs;
    }>,
  ): api.Signal<Self.DataPoint[]> {
    return api.resource({
      url: api.url`${URL}/meters/${meterId}/recorded-usages`,
      validateRaw: typia.createValidate<Raw.DataPoint[]>(),
      parse: dts => dts.map(dt => ({...dt, time: dayjs(dt.time)})),
      params: api.QueryParams.from(params ?? {}),
      cache: dayjs.duration(1, "day"),
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
        comment?: string;
      }>,
    ): api.Signal<Self.TrainingInitiation> => {
      return api.resource({
        url: api.url`${URL}/training/start/${meterId}`,
        method: "PUT",
        params: api.QueryParams.from(params),
        validateRaw: typia.createValidate<Raw.TrainingInitiation>(),
        parse: ({modelId, trainingId}) => ({
          modelId: ModelId.of(modelId),
          trainingId: TrainingId.of(trainingId),
        }),
      });
    },

    status: (trainingId: TrainingId): api.Socket<string, never> => {
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

  export type Prediction = Omit<
    api.RawRecord<Self.Prediction>,
    "datapoints"
  > & {
    datapoints: ConfidenceDataPoint[];
  };

  export type SmartMeter = typeUtils.LooseOptionals<
    api.RawRecord<Self.SmartMeter>
  >;

  export type ModelMetaData = typeUtils.LooseOptionals<
    api.RawRecord<Self.ModelMetaData>
  >;

  export type WeatherColumn = api.RawRecord<Self.WeatherColumn>;

  export type WeatherCapability = Omit<
    api.RawRecord<Self.WeatherCapability>,
    "columns"
  > & {columns: WeatherColumn[]};

  export type TrainingInitiation = api.RawRecord<Self.TrainingInitiation>;
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
    madeWithModel: ModelId;
    mae: number & tags.Type<"double">;
    mse: number & tags.Type<"double">;
    rmse: number & tags.Type<"double">;
    r2: number & tags.Type<"double">;
    datapoints: ConfidenceDataPoint[];
  };

  export type SmartMeter = {
    id: SmartMeterId;
    name: string;
    description?: string;
  };

  export type ModelMetaData = {
    id: ModelId;
    meter: SmartMeterId;
    hash: string;
    dataStartsAt?: Dayjs;
    dataEndsAt?: Dayjs;
    weatherCapability?: SupportedCapability;
    capabilityColumn?: string;
    trainingDuration?: Duration;
    trainingStart?: Dayjs;
    comment?: string;
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

  export type TrainingInitiation = {
    modelId: ModelId;
    trainingId: TrainingId;
  };
}

import Self = PmdArimaPredictionService;
import {typeUtils} from "../common/utils/type-utils";
import {HttpClient, HttpContext} from "@angular/common/http";
import {firstValueFrom} from "rxjs";
import {httpContexts} from "../common/http-contexts";
