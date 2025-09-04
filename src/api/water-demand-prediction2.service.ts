// cspell:ignore startpoint waterdemand

import {computed, isSignal, Injectable} from "@angular/core";
import dayjs, {Dayjs} from "dayjs";
import typia, {tags} from "typia";

import {api} from "../common/api";

const URL = "/api/waterdemand" as const;

@Injectable({
  providedIn: "root",
})
export class WaterDemandPrediction2Service extends api.service(URL) {
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
      validate: typia.createValidate<Self.SingleSmartmeter>(),
      body: this.mapStartPoint(params),
      cache: dayjs.duration(1, "day"),
    });
  }

  trainModel(
    params: api.RequestSignal<{
      startpoint: string & DateTime;
      name: string;
      timeframe: Self.Timeframe;
      resolution: Self.Resolution;
      weatherCapability: Self.WeatherCapability;
      weatherColumn: string;
    }>,
  ): api.Signal<string> {
    return api.resource({
      url: `${URL}/trainModel`,
      method: `POST`,
      validate: typia.createValidate<string>(),
      body: params,
    });
  }

  /** fetch predicted smartmeter data based on requested parameters */
  fetchPrediction(
    params: api.RequestSignal<{
      startpoint: string & DateTime;
      name: string;
      timeframe: Self.Timeframe;
      resolution: Self.Resolution;
      weatherCapability: Self.WeatherCapability;
      weatherColumn: string;
    }>,
  ): api.Signal<Self.PredictedSmartmeter> {
    // NOTE: Maybe add an extra identifier if model requested is trained

    return api.resource({
      url: `${URL}/loadModelAndPredict`,
      method: `POST`,
      validate: typia.createValidate<Self.PredictedSmartmeter>(),
      body: params,
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
}

type DateTime = tags.TagBase<{
  kind: "wdp-date-time";
  target: "string";
  value: undefined;
  // validate: '/^"\d{2}.\d{2}.\d{2} \d{2}:\d{2}"$/.test($input)'
}>;

export namespace WaterDemandPrediction2Service {
  export type Resolution = "hourly" | "daily" | "weekly";
  export type Timeframe =
    | "one day"
    | "one week"
    | "one month"
    | "three months"
    | "six months"
    | "one year"
    | "all";
  export type WeatherCapability =
    | "plain"
    | "air_temperature"
    | "precipitation"
    | "moisture";
  export type WeatherColumns = Record<string, string>;
  export type MeterNames = Record<string, string>;
  export type SingleSmartmeter = {
    name: string;
    resolution: Resolution;
    timeframe: Timeframe;
    value: (number & tags.Type<"double">)[];
    date: (string & DateTime)[];
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
    resolution: Resolution;
    rootOfmeanSquaredError: number & tags.Type<"double">;
    timeframe: Timeframe;
    upperConfValues: (number & tags.Type<"double">)[];
    value: (number & tags.Type<"double">)[];
  };
}

import Self = WaterDemandPrediction2Service;
