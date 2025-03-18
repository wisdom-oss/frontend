import {HttpClient} from "@angular/common/http";
import {Injectable} from "@angular/core";
import {Router} from "@angular/router";
import {Observable} from "rxjs";

const API_PREFIX = "waterdemand";

const DEV_PREFIX = "local";

// need to be specified when docker is on server
const DOCKER_PREFIX = "dev";

const enum Status {
  Dev = 0,
  DockerDev = 1,
  Production = 2,
}

const PROD_STATUS: Status = Status.DockerDev;

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
  ) {}

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

    let final_url: string | undefined;

    switch (PROD_STATUS) {
      case Status.Dev:
        final_url = this.router
          .parseUrl("/" + DEV_PREFIX + "/" + API_PREFIX + url)
          .toString();
        break;
      case Status.DockerDev:
        final_url = this.router
          .parseUrl("/" + DOCKER_PREFIX + "/" + API_PREFIX + url)
          .toString();
        break;
      case Status.Production:
        final_url = this.router.parseUrl("/api/" + API_PREFIX + url).toString();
        break;
      default:
        console.error(
          "Error: PROD_STATUS has an unexpected value:",
          PROD_STATUS,
        );
        throw new Error(
          "Invalid PROD_STATUS value, cannot determine final_url.",
        );
    }

    return this.http.request<T>(
      method,
      final_url!,
      requestOptions,
    ) as Observable<T>;
  }

  fetchMeterInformation(): Observable<any> {
    return this.sendRequest("get", "/meterInformation");
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

  fetchSinglePredictionSmartmeter(
    startpoint: string,
    nameOfSmartmeter: string,
    timeframe: string,
    resolution: string,
    useWeather: boolean,
  ): Observable<any> {
    return this.sendRequest("post", "/loadModelAndPredict", {
      startpoint: startpoint,
      name: nameOfSmartmeter,
      timeframe: timeframe,
      resolution: resolution,
      useWeather: useWeather,
    });
  }

  trainModelOnSingleSmartmeter(
    startpoint: string,
    nameOfSmartmeter: string,
    timeframe: string,
    resolution: string,
    useWeather: boolean,
  ): Observable<any> {
    return this.sendRequest("post", "/trainModel", {
      startpoint: startpoint,
      name: nameOfSmartmeter,
      timeframe: timeframe,
      resolution: resolution,
      useWeather: useWeather,
    });
  }

  /**
   * creates an Observable with an error to subscribe to it and logs the information in the console.
   * @param msg error meesage
   * @returns observable with contained error.
   */
  handleError(msg: string): Observable<any> {
    return new Observable(observer => {
      observer.error(new Error(msg));
    });
  }
}
