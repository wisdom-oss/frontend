import { HttpClient } from "@angular/common/http";
import { computed, Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { Observable } from "rxjs";

import { api } from "../common/api";
import typia from "typia";

const API_PREFIX = "/api/waterdemand";

/**
 * injects the service to be singleton throughout project.
 * // NOTE: Discuss if necessary
 */
@Injectable({
  providedIn: "root",
})
export class WaterDemandPredictionService {
  constructor(
    private http: HttpClient,
    private router: Router,
  ) { }

  /**
   * generalized request method for bws api
   * @param method to use for request
   * @param url string as api endpoint
   * @param prod true if for production, false else
   * @param requestBody bonus information in post and put requests
   * @returns an Observable with the set interface
   */
  sendRequest<T>(
    method: "get" | "post" | "put" | "delete",
    url: string,
    requestBody?: any,
  ) {
    let requestOptions: any = {
      //context: ctx,
      responseType: "json",
      body: requestBody,
    };

    let final_url = this.router.parseUrl(API_PREFIX + url).toString();
    console.log(final_url)

    return this.http.request<T>(
      method,
      final_url!,
      requestOptions,
    ) as Observable<T>;
  }

  fetchMeterInformation(): Observable<any> {
    return this.sendRequest("get", "/meterNames");
  }

  fetchSignalMeterInformation(): api.Signal<MeterNames> {
    return api.resource({
      url: api.url`${API_PREFIX}/meterNames`,
      method: `GET`,
      validate: typia.createValidate<MeterNames>(),
    })
  }

  fetchWeatherColumns(capability: string): Observable<any> {
    return this.sendRequest("post", "/weatherColumns", {
      capability: capability,
    });
  }

  fetchSignalWeatherColumns(capability: api.RequestSignal<string>): api.Signal<WeatherColumns> {
    let body = api.map(capability, capability => ({ capability }))
    return api.resource(
      {
        url: api.url`${API_PREFIX}/weatherColumns`,
        method: `POST`,
        validate: typia.createValidate<WeatherColumns>(),
        body
      }
    );
  }

  fetchSingleSmartmeter(
    startpoint: string,
    nameOfSmartmeter: string,
    timeframe: string,
    resolution: string,
  ): Observable<any> {
    return this.sendRequest("post", "/singleSmartmeter", {
      startpoint: startpoint,
      name: nameOfSmartmeter,
      timeframe: timeframe,
      resolution: resolution,
    });
  }

  /** fetch a single smartmeter data based on requested parameters */
  fetchSignalSingleSmartmeter(startpoint: api.RequestSignal<string>, name: api.RequestSignal<string>,
    timeframe: api.RequestSignal<string>, resolution: api.RequestSignal<string>): api.Signal<SingleSmartmeter> {

    let body = computed(() => ({
      startpoint: api.toSignal(startpoint)(),
      name: api.toSignal(name)(),
      timeframe: api.toSignal(timeframe)(),
      resolution: api.toSignal(resolution)(),
    }));

    return api.resource(
      {
        url: api.url`${API_PREFIX}/singleSmartmeter`,
        method: `POST`,
        validate: typia.createValidate<SingleSmartmeter>(),
        body
      }
    );
  }

  fetchSinglePredictionSmartmeter(
    startpoint: string,
    nameOfSmartmeter: string,
    timeframe: string,
    resolution: string,
    weatherCapability: string,
    weatherColumn?: string,
  ): Observable<any> {
    return this.sendRequest("post", "/loadModelAndPredict", {
      startpoint: startpoint,
      name: nameOfSmartmeter,
      timeframe: timeframe,
      resolution: resolution,
      weatherCapability: weatherCapability,
      weatherColumn: weatherColumn,
    });
  }

  /** fetch a single smartmeter data based on requested parameters */
  fetchSignalSinglePredictionSmartmeter(startpoint: api.RequestSignal<string>, name: api.RequestSignal<string>,
    timeframe: api.RequestSignal<string>, resolution: api.RequestSignal<string>, weatherCapability: api.RequestSignal<string>,
    weatherColumn: api.RequestSignal<string>): api.Signal<PredictedSmartmeter> {

    let body = computed(() => ({
      startpoint: api.toSignal(startpoint)(),
      name: api.toSignal(name)(),
      timeframe: api.toSignal(timeframe)(),
      resolution: api.toSignal(resolution)(),
      weatherCapability: api.toSignal(weatherCapability)(),
      weatherColumn: api.toSignal(weatherColumn)()
    }));

    console.log(body());

    return api.resource(
      {
        url: api.url`${API_PREFIX}/singleSmartmeter`,
        method: `POST`,
        validate: typia.createValidate<PredictedSmartmeter>(),
        body
      }
    );
  }

  trainModelOnSingleSmartmeter(
    startpoint: string,
    nameOfSmartmeter: string,
    timeframe: string,
    resolution: string,
    weatherCapability: string,
    weatherColumn?: string,
  ): Observable<any> {
    return this.sendRequest("post", "/trainModel", {
      startpoint: startpoint,
      name: nameOfSmartmeter,
      timeframe: timeframe,
      resolution: resolution,
      weatherCapability: weatherCapability,
      weatherColumn: weatherColumn,
    });
  }
}

export type WeatherColumns = Record<string, string>
export type MeterNames = Record<string, string>
export type SingleSmartmeter = {
  name: string;
  resolution: string;
  timeframe: string;
  value: number[];
  date: string[];
}
export type PredictedSmartmeter = {
  name: string;
  resolution: string;
  timeframe: string;
  value: number[];
  date: string[];
  lowerConfValues: [];
  upperConfValues: [];
  realValue: [];
  meanAbsoluteError: number;
  meanSquaredError: number;
  rootOfmeanSquaredError: number;
  r2: number;
  aic: number;
  fitTime: string;
}
