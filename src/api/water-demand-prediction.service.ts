import {HttpClient} from "@angular/common/http";
import {Injectable} from "@angular/core";
import {Router} from "@angular/router";
import {Observable} from "rxjs";

const API_PREFIX = "waterdemand";
const DEV_PREFIX = "local";
const PROD_STATUS = false;

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

    if (PROD_STATUS) {
      final_url = this.router.parseUrl("/api/" + API_PREFIX + url).toString();
    } else {
      final_url = this.router
        .parseUrl("/" + DEV_PREFIX + "/" + API_PREFIX + url)
        .toString();
    }

    return this.http.request<T>(
      method,
      final_url,
      requestOptions,
    ) as Observable<T>;
  }

  fetchMeterInformation(): Observable<any> {
    return this.sendRequest("get", "/meterInformation");
  }

  fetchSingleSmartmeter(
    nameOfSmartmeter: string,
    timeframe: string,
    resolution: string,
  ): Observable<any> {
    return this.sendRequest("post", "/singleSmartmeter", {
      name: nameOfSmartmeter,
      timeframe: timeframe,
      resolution: resolution,
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
