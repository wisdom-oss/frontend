// cspell:ignore startpoint waterdemand

import {computed, isSignal, Injectable} from "@angular/core";
import dayjs, {Dayjs} from "dayjs";
import {Duration} from "dayjs/plugin/duration";
import typia, {tags} from "typia";

import {keys} from "../common/utils/keys";
import {omit} from "../common/utils/omit";
import {api} from "../common/api";

const URL = "/api/waterdemand" as const;

@Injectable({
  providedIn: "root",
})
export class WaterDemandPredictionService extends api.service(URL) {
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
    ...keys(WaterDemandPredictionService.TIMEFRAME_DURATIONS),
    "all",
  ] as const;

  static readonly WEATHER_CAPABILITIES = [
    "air_temperature",
    "precipitation",
    "moisture",
  ] as const;

  static readonly START_POINTS = {
    startOfData: dayjs("2021-05-26"),
    startOfJune21: dayjs("2021-06-01"),
    startOfYear22: dayjs("2022-01-01"),
  } as const;

  fetchMeterNames(): api.Signal<Self.MeterNames, Self.MeterNames> {
    return api.resource({
      url: `${URL}/meter-names`,
      validate: typia.createValidate<Self.MeterNames>(),
      defaultValue: [],
      cache: dayjs.duration(1, "day"),
    });
  }

  fetchWeatherColumns(
    params: api.RequestSignal<{
      capability?: Self.WeatherCapability[];
      resolution?: Self.Resolution;
      start?: Dayjs;
      end?: Dayjs;
    }>,
  ): api.Signal<Self.WeatherColumns> {
    return api.resource({
      url: `${URL}/weather-columns`,
      method: `POST`,
      validate: typia.createValidate<Self.WeatherColumns>(),
      params: api.QueryParams.from(params),
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
    // return api.resource({
    //   url: `${URL}/singleSmartmeter`,
    //   method: `POST`,
    //   validateRaw: typia.createValidate<Raw.SingleSmartmeter>(),
    //   parse: this.parseDate,
    //   validate: typia.createValidate<Self.SingleSmartmeter>(),
    //   body: this.mapStartPoint(params),
    //   cache: dayjs.duration(1, "day"),
    // });
    return null as any;
  }

  trainModel(
    params: api.RequestSignal<Params.Model>,
  ): api.Signal<Self.TrainingResult> {
    let parse = (raw: Raw.TrainingResult): Self.TrainingResult => ({
      status: raw.status,
      details: {
        trainingTime: dayjs.duration(raw.details.trainingTime, "seconds"),
        modelStartDate: dayjs(raw.details.modelStartDate),
        modelEndDate: dayjs(raw.details.modelEndDate),
      },
    });

    return api.resource({
      url: `${URL}/trainModel`,
      method: `POST`,
      validateRaw: typia.createValidate<Raw.TrainingResult>(),
      parse,
      validate: this.validateTrainingResult,
      body: this.mapStartPoint(params, {iso: true}),
      onError: {409: () => ({status: "model_already_exists"})},
    });
  }

  fetchPrediction(
    params: api.RequestSignal<Params.Model>,
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
      equal: () => false,
      validate: typia.createValidate<Self.PredictedSmartmeter>(),
      body: this.mapStartPoint(params, {iso: true}),
      onError: {424: () => undefined},
    });
  }

  private mapStartPoint<P extends {startPoint: Dayjs}>(
    params: api.RequestSignal<P>,
    options?: {iso?: boolean},
  ): api.RequestSignal<
    Omit<P, "startPoint"> & {startpoint: string & DateTime}
  > {
    let mapParams = (params: P) => {
      let mapped: Omit<P, "startPoint"> & {
        startPoint?: Dayjs;
        startpoint: string & DateTime;
      } = {
        ...params,
        startpoint: options?.iso
          ? params.startPoint.toISOString()
          : params.startPoint.format("YYYY-MM-DD HH:mm:ss"),
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

  /**
   * Validation function for `Self.TrainingResult`.
   *
   * `typia` has trouble generating such a function as it includes `Duration`.
   */
  private validateTrainingResult(
    input: unknown,
  ): typia.IValidation<Self.TrainingResult> {
    type TypiaTrainingResult = {
      status: Self.TrainingResult["status"];
      details?: {
        trainingTime: object;
        modelStartDate: object;
        modelEndDate: object;
      };
    };

    let simple = typia.validate<TypiaTrainingResult>(input);
    if (!simple.success) return simple;
    if (!simple.data.details)
      return simple as typia.IValidation<Self.TrainingResult>;

    let trainingTime = dayjs.isDuration(simple.data.details.trainingTime);
    let modelStartDate = dayjs.isDayjs(simple.data.details.modelStartDate);
    let modelEndDate = dayjs.isDayjs(simple.data.details.modelEndDate);

    if (trainingTime && modelStartDate && modelEndDate)
      return simple as typia.IValidation<Self.TrainingResult>;

    let errors = [];
    if (!trainingTime)
      errors.push({
        path: "$input.details.trainingTime",
        expected: "Duration",
        value: simple.data.details.trainingTime,
      });
    if (!modelStartDate)
      errors.push({
        path: "$input.details.modelStartDate",
        expected: "Dajys",
        value: simple.data.details.modelStartDate,
      });
    if (!modelEndDate)
      errors.push({
        path: "$input.details.modelEndDate",
        expected: "Dayjs",
        value: simple.data.details.modelEndDate,
      });

    return {
      success: false,
      data: input,
      errors,
    };
  }
}

type DateTime = tags.TagBase<{
  kind: "wdp-date-time";
  target: "string";
  value: undefined;
  // validate: '/^"\d{2}.\d{2}.\d{2} \d{2}:\d{2}"$/.test($input)'
}>;

namespace Params {
  export type Model = {
    startPoint: Dayjs;
    name: string;
    timeframe: Self.Timeframe;
    resolution: Self.Resolution;
  } & (
    | {
        weatherCapability: "plain";
      }
    | {
        weatherCapability: Exclude<Self.WeatherCapability, "plain">;
        weatherColumn: string;
      }
  );
}

namespace Raw {
  export type SingleSmartmeter = {
    name: string;
    resolution: Self.Resolution;
    timeframe: Self.Timeframe;
    value: (number & tags.Type<"double">)[];
    date: (string & DateTime)[];
  };
  export type TrainingResult = {
    status: "model_trained";
    details: {
      trainingTime: number & tags.Type<"double">; // seconds
      modelStartDate: string & tags.Format<"date-time">;
      modelEndDate: string & tags.Format<"date-time">;
    };
  };
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

export namespace WaterDemandPredictionService {
  export type Resolution =
    (typeof WaterDemandPredictionService)["RESOLUTIONS"][number];
  export type Timeframe =
    (typeof WaterDemandPredictionService)["TIMEFRAMES"][number];
  export type WeatherCapability =
    (typeof WaterDemandPredictionService)["WEATHER_CAPABILITIES"][number];
  export type WeatherColumns = Record<string, string>;
  export type MeterNames = {id: string; name: string}[];
  export type SingleSmartmeter = Omit<Raw.SingleSmartmeter, "date"> & {
    date: Dayjs[];
  };
  export type TrainingResult = {
    status: "model_trained" | "model_already_exists";
    details?: {
      trainingTime: Duration;
      modelStartDate: Dayjs;
      modelEndDate: Dayjs;
    };
  };
  export type PredictedSmartmeter = Omit<
    Raw.PredictedSmartmeter,
    "date" | "rootOfmeanSquaredError"
  > & {date: Dayjs[]; rootOfMeanSquaredError: number & tags.Type<"double">};
}

import Self = WaterDemandPredictionService;
