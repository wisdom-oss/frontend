import {Injectable} from "@angular/core";
import typia from "typia";

import {api} from "../common/api";

const URL = "/api/waterdemand" as const;

@Injectable({
  providedIn: "root",
})
export class WaterDemandPredictionService {
  fetchMeterInformation(): api.Signal<Self.MeterNames> {
    return api.resource({
      url: `${URL}/meterNames`,
      validate: typia.createValidate<Self.MeterNames>(),
      defaultValue: {},
    });
  }

  fetchWeatherCols(
    capability: api.RequestSignal<string>,
  ): api.Signal<Self.WeatherColumns> {
    let body = api.map(capability, capability => ({capability}));
    return api.resource({
      url: `${URL}/weatherColumns`,
      method: `POST`,
      validate: typia.createValidate<Self.WeatherColumns>(),
      body,
    });
  }

  /**
   * Fetch a single smartmeter data based on requested parameters.
   *
   * Only send a request when every parameter is defined.
   */
  fetchSmartmeter(params: {
    startpoint: api.RequestSignal<string>;
    name: api.RequestSignal<string>;
    timeframe: api.RequestSignal<string>;
    resolution: api.RequestSignal<string>;
  }): api.Signal<Self.SingleSmartmeter> {
    return api.resource({
      url: `${URL}/singleSmartmeter`,
      method: `POST`,
      validate: typia.createValidate<Self.SingleSmartmeter>(),
      body: api.require(params),
    });
  }

  trainModel(params: {
    startpoint: api.RequestSignal<string>;
    name: api.RequestSignal<string>;
    timeframe: api.RequestSignal<string>;
    resolution: api.RequestSignal<string>;
    weatherCapability: api.RequestSignal<string>;
    weatherColumn: api.RequestSignal<string>;
    trigger: api.RequestSignal<boolean>;
  }): api.Signal<string> {
    return api.resource({
      url: `${URL}/trainModel`,
      method: `POST`,
      validate: typia.createValidate<string>(),
      body: api.require(params),
    });
  }

  /** fetch predicted smartmeter data based on requested parameters */
  fetchPrediction(params: {
    startpoint: api.RequestSignal<string>;
    name: api.RequestSignal<string>;
    timeframe: api.RequestSignal<string>;
    resolution: api.RequestSignal<string>;
    weatherCapability: api.RequestSignal<string>;
    weatherColumn: api.RequestSignal<string>;
    trigger: api.RequestSignal<boolean>;
  }): api.Signal<Self.PredictedSmartmeter> {
    // NOTE: Maybe add an extra identifier if model requested is trained

    return api.resource({
      url: `${URL}/loadModelAndPredict`,
      method: `POST`,
      validate: typia.createValidate<Self.PredictedSmartmeter>(),
      body: api.require(params),
    });
  }
}

export namespace WaterDemandPredictionService {
  export type WeatherColumns = Record<string, string>;
  export type MeterNames = Record<string, string>;
  export type SingleSmartmeter = {
    name: string;
    resolution: string;
    timeframe: string;
    value: number[];
    date: string[];
  };
  export type PredictedSmartmeter = {
    aic: number;
    date: string[];
    fitTime: number;
    lowerConfValues: number[];
    meanAbsoluteError: number;
    meanSquaredError: number;
    name: string;
    r2: number;
    realValue: number[];
    resolution: string;
    rootOfmeanSquaredError: number;
    timeframe: string;
    upperConfValues: number[];
    value: number[];
  };
}

import Self = WaterDemandPredictionService;
