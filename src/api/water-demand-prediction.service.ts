import {computed, Injectable} from "@angular/core";
import typia from "typia";

import {api} from "../common/api";

const API_PREFIX = "/api/waterdemand";

/**
 * injects the service to be singleton throughout project.
 * // NOTE: Discuss if necessary
 */
@Injectable({
  providedIn: "root",
})
export class WaterDemandPredictionService {
  constructor() {}

  fetchMeterInformation(): api.Signal<MeterNames> {
    return api.resource({
      url: api.url`${API_PREFIX}/meterNames`,
      method: `GET`,
      validate: typia.createValidate<MeterNames>(),
      defaultValue: {},
    });
  }

  fetchWeatherCols(
    capability: api.RequestSignal<string>,
  ): api.Signal<WeatherColumns> {
    let body = api.map(capability, capability => ({capability}));
    return api.resource({
      url: api.url`${API_PREFIX}/weatherColumns`,
      method: `POST`,
      validate: typia.createValidate<WeatherColumns>(),
      body,
    });
  }

  /** fetch a single smartmeter data based on requested parameters, only when every parameter is defined */
  fetchSmartmeter(
    startpoint: api.RequestSignal<string>,
    name: api.RequestSignal<string>,
    timeframe: api.RequestSignal<string>,
    resolution: api.RequestSignal<string>,
  ): api.Signal<SingleSmartmeter> {
    let body = api.map(
      computed(() => [
        api.toSignal(startpoint)(),
        api.toSignal(name)(),
        api.toSignal(timeframe)(),
        api.toSignal(resolution)(),
      ]),

      ([startpoint, name, timeframe, resolution]) => {
        if (!startpoint || !name || !timeframe || !resolution) return undefined;
        return {startpoint, name, timeframe, resolution};
      },
    );

    return api.resource({
      url: api.url`${API_PREFIX}/singleSmartmeter`,
      method: `POST`,
      validate: typia.createValidate<SingleSmartmeter>(),
      body,
    });
  }

  trainModel(
    startpoint: api.RequestSignal<string>,
    name: api.RequestSignal<string>,
    timeframe: api.RequestSignal<string>,
    resolution: api.RequestSignal<string>,
    weatherCapability: api.RequestSignal<string>,
    weatherColumn: api.RequestSignal<string>,
    trigger: api.RequestSignal<boolean>,
  ): api.Signal<string> {
    let body = api.map(
      computed(() => [
        api.toSignal(startpoint)(),
        api.toSignal(name)(),
        api.toSignal(timeframe)(),
        api.toSignal(resolution)(),
        api.toSignal(weatherCapability)(),
        api.toSignal(weatherColumn)(),
        api.toSignal(trigger)(),
      ]),

      ([
        startpoint,
        name,
        timeframe,
        resolution,
        weatherCapability,
        weatherColumn,
        trigger,
      ]) => {
        if (
          !startpoint ||
          !name ||
          !timeframe ||
          !resolution ||
          !weatherCapability ||
          !weatherColumn ||
          !trigger
        )
          return undefined;
        return {
          startpoint,
          name,
          timeframe,
          resolution,
          weatherCapability,
          weatherColumn,
        };
      },
    );

    return api.resource({
      url: api.url`${API_PREFIX}/trainModel`,
      method: `POST`,
      validate: typia.createValidate<string>(),
      body,
    });
  }

  /** fetch predicted smartmeter data based on requested parameters */
  fetchPrediction(
    startpoint: api.RequestSignal<string>,
    name: api.RequestSignal<string>,
    timeframe: api.RequestSignal<string>,
    resolution: api.RequestSignal<string>,
    weatherCapability: api.RequestSignal<string>,
    weatherColumn: api.RequestSignal<string>,
    trigger: api.RequestSignal<boolean>,
  ): api.Signal<PredictedSmartmeter> {
    //NOTE: Maybe add an extra identifier if model requested is trained

    let body = api.map(
      computed(() => [
        api.toSignal(startpoint)(),
        api.toSignal(name)(),
        api.toSignal(timeframe)(),
        api.toSignal(resolution)(),
        api.toSignal(weatherCapability)(),
        api.toSignal(weatherColumn)(),
        api.toSignal(trigger)(),
      ]),

      ([
        startpoint,
        name,
        timeframe,
        resolution,
        weatherCapability,
        weatherColumn,
        trigger,
      ]) => {
        if (
          !startpoint ||
          !name ||
          !timeframe ||
          !resolution ||
          !weatherCapability ||
          !weatherColumn ||
          !trigger
        )
          return undefined;
        return {
          startpoint,
          name,
          timeframe,
          resolution,
          weatherCapability,
          weatherColumn,
        };
      },
    );

    return api.resource({
      url: api.url`${API_PREFIX}/loadModelAndPredict`,
      method: `POST`,
      validate: typia.createValidate<PredictedSmartmeter>(),
      body,
    });
  }
}

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
