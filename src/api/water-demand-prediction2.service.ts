// cspell:ignore startpoint waterdemand

import {computed, isSignal, Injectable} from "@angular/core";
import dayjs, {Dayjs} from "dayjs";
import typia, {tags} from "typia";

import {keys} from "../common/utils/keys";
import {omit} from "../common/utils/omit";
import {api} from "../common/api";

const URL = "/api/waterdemand" as const;

@Injectable({
  providedIn: "root",
})
export class WaterDemandPrediction2Service extends api.service(URL) {
  static readonly RESOLUTIONS = ["hourly", "daily", "weekly"] as const;

  static readonly TIMEFRAME_DURATIONS = {
    "one day": dayjs.duration(1, "day"),
    "one week": dayjs.duration(1, "week"),
    "one month": dayjs.duration(1, "month"),
    "three months": dayjs.duration(3, "months"),
    "six months": dayjs.duration(6, "months"),
    "one year": dayjs.duration(1, "year"),
  } as const;

  static readonly TIMEFRAMES = [
    ...keys(WaterDemandPrediction2Service.TIMEFRAME_DURATIONS),
    "all",
  ] as const;

  static readonly WEATHER_CAPABILITIES = [
    "plain",
    "air_temperature",
    "precipitation",
    "moisture",
  ] as const;

  static readonly START_POINTS = {
    startOfData: dayjs("2021-05-26"),
    startOfJune21: dayjs("2021-06-01"),
    startOfYear22: dayjs("2022-01-01"),
  } as const;

  private static readonly TRAINING_RESULT = {
    existsAlready: "Model already exists",
    saved: "Model saved successfully",
  } as const;

  fetchMeterInformation(): api.Signal<Self.MeterNames, Self.MeterNames> {
    return api.resource({
      url: `${URL}/meterNames`,
      validate: typia.createValidate<Self.MeterNames>(),
      defaultValue: {},
      cache: dayjs.duration(1, "day"),
    });
  }

  fetchWeatherCols(
    capability: api.RequestSignal<Self.WeatherCapability>,
  ): api.Signal<Self.WeatherColumns> {
    let body = api.map(capability, capability => ({capability}));
    return api.resource({
      url: `${URL}/weatherColumns`,
      method: `POST`,
      validate: typia.createValidate<Self.WeatherColumns>(),
      body,
      cache: dayjs.duration(1, "day"),
    });
  }

  /** Fetch a single smartmeter data based on requested parameters. */
  fetchSmartmeter(
    params: api.RequestSignal<{
      startPoint: Dayjs;
      name: string;
      timeframe: Self.Timeframe;
      resolution: Self.Resolution;
    }>,
  ): api.Signal<Self.SingleSmartmeter> {
    return api.resource({
      url: `${URL}/singleSmartmeter`,
      method: `POST`,
      validateRaw: typia.createValidate<Raw.SingleSmartmeter>(),
      parse: this.parseDate,
      validate: typia.createValidate<Self.SingleSmartmeter>(),
      body: this.mapStartPoint(params),
      cache: dayjs.duration(1, "day"),
    });
  }

  trainModel(
    params: api.RequestSignal<{
      startPoint: Dayjs;
      name: string;
      timeframe: Self.Timeframe;
      resolution: Self.Resolution;
      weatherCapability: Self.WeatherCapability;
      weatherColumn: string;
    }>,
  ): api.Signal<Self.TrainingResult> {
    let parse = (raw: Raw.TrainingResult): Self.TrainingResult => {
      switch (raw) {
        case WaterDemandPrediction2Service.TRAINING_RESULT.existsAlready:
          return "existsAlready";
        case WaterDemandPrediction2Service.TRAINING_RESULT.saved:
          return "saved";
      }
    };

    return api.resource({
      url: `${URL}/trainModel`,
      method: `POST`,
      validateRaw: typia.createValidate<Raw.TrainingResult>(),
      parse,
      validate: typia.createValidate<Self.TrainingResult>(),
      body: this.mapStartPoint(params),
    });
  }

  fetchPrediction(
    params: api.RequestSignal<{
      startPoint: Dayjs;
      name: string;
      timeframe: Self.Timeframe;
      resolution: Self.Resolution;
      weatherCapability: Self.WeatherCapability;
      weatherColumn: string;
    }>,
  ): api.Signal<Self.PredictedSmartmeter> {
    let parse = (raw: Raw.PredictedSmartmeter) => {
      let mappedDate = this.parseDate(raw);
      return {
        ...omit(mappedDate, "rootOfmeanSquaredError"),
        rootOfMeanSquaredError: mappedDate.rootOfmeanSquaredError,
      } satisfies Self.PredictedSmartmeter;
    };

    return api.resource({
      url: `${URL}/loadModelAndPredict`,
      method: `POST`,
      validateRaw: typia.createValidate<Raw.PredictedSmartmeter>(),
      parse,
      validate: typia.createValidate<Self.PredictedSmartmeter>(),
      body: this.mapStartPoint(params),
    });
  }

  private mapStartPoint<P extends {startPoint: Dayjs}>(
    params: api.RequestSignal<P>,
  ): api.RequestSignal<
    Omit<P, "startPoint"> & {startpoint: string & DateTime}
  > {
    let mapParams = (params: P) => {
      let mapped: Omit<P, "startPoint"> & {
        startPoint?: Dayjs;
        startpoint: string & DateTime;
      } = {
        ...params,
        startpoint: params.startPoint.format("YYYY-MM-DD HH:mm:ss"),
      };
      delete mapped.startPoint;
      return mapped;
    };

    if (!isSignal(params)) return mapParams(params);

    return computed(() => {
      let signaled = params();
      if (!signaled) return undefined;
      return mapParams(signaled);
    });
  }

  private parseDate<R extends {date: (string & DateTime)[]}>(
    raw: R,
  ): {[K in keyof Omit<R, "date">]: R[K]} & {date: Dayjs[]} {
    return {
      ...raw,
      date: raw.date.map(date => dayjs(date, "DD.MM.YY HH:mm")),
    };
  }
}

type DateTime = tags.TagBase<{
  kind: "wdp-date-time";
  target: "string";
  value: undefined;
  // validate: '/^"\d{2}.\d{2}.\d{2} \d{2}:\d{2}"$/.test($input)'
}>;

namespace Raw {
  export type SingleSmartmeter = {
    name: string;
    resolution: Self.Resolution;
    timeframe: Self.Timeframe;
    value: (number & tags.Type<"double">)[];
    date: (string & DateTime)[];
  };
  export type TrainingResult =
    (typeof Self)["TRAINING_RESULT"][keyof (typeof Self)["TRAINING_RESULT"]];
  export type PredictedSmartmeter = {
    aic: number & tags.Type<"double">;
    date: (string & DateTime)[];
    fitTime: number & tags.Type<"double">;
    lowerConfValues: (number & tags.Type<"double">)[];
    meanAbsoluteError: number & tags.Type<"double">;
    meanSquaredError: number & tags.Type<"double">;
    name: string;
    r2: number & tags.Type<"double">;
    realValue: (number & tags.Type<"double">)[];
    resolution: Self.Resolution;
    rootOfmeanSquaredError: number & tags.Type<"double">;
    timeframe: Self.Timeframe;
    upperConfValues: (number & tags.Type<"double">)[];
    value: (number & tags.Type<"double">)[];
  };
}

export namespace WaterDemandPrediction2Service {
  export type Resolution =
    (typeof WaterDemandPrediction2Service)["RESOLUTIONS"][number];
  export type Timeframe =
    (typeof WaterDemandPrediction2Service)["TIMEFRAMES"][number];
  export type WeatherCapability =
    (typeof WaterDemandPrediction2Service)["WEATHER_CAPABILITIES"][number];
  export type WeatherColumns = Record<string, string>;
  export type MeterNames = Record<string, string>;
  export type SingleSmartmeter = Omit<Raw.SingleSmartmeter, "date"> & {
    date: Dayjs[];
  };
  export type TrainingResult = keyof (typeof Self)["TRAINING_RESULT"];
  export type PredictedSmartmeter = Omit<
    Raw.PredictedSmartmeter,
    "date" | "rootOfmeanSquaredError"
  > & {date: Dayjs[]; rootOfMeanSquaredError: number & tags.Type<"double">};
}

import Self = WaterDemandPrediction2Service;
