import {HttpClient, HttpContext, HttpParams} from "@angular/common/http";
import {Injectable} from "@angular/core";
import dayjs, {Dayjs} from "dayjs";
import {FeatureCollection, Point} from "geojson";
import {firstValueFrom} from "rxjs";
import typia from "typia";

import {httpContexts} from "../common/http-contexts";

const URL = "/api/dwd" as const;

@Injectable({
  providedIn: "root",
})
export class DwdService {
  private cacheTtl = dayjs.duration(12, "hours");

  constructor(private http: HttpClient) {}

  readonly v2 = {
    fetchStations: (): Promise<DwdService.V2.Stations> => {
      let url = `${URL}/v2/stations`;
      return firstValueFrom(
        this.http.get<DwdService.V2.Stations>(url, {
          context: new HttpContext()
            .set(
              httpContexts.validateType,
              typia.createValidate<DwdService.V2.Stations>(),
            )
            .set(httpContexts.cache, [url, this.cacheTtl]),
        }),
      );
    },
  };

  readonly v1 = {
    fetchStations: (): Promise<DwdService.V1.Stations> => {
      let url = `${URL}/v1/`;
      return firstValueFrom(
        this.http.get<DwdService.V1.Stations>(url, {
          context: new HttpContext()
            .set(
              httpContexts.validateType,
              typia.createValidate<DwdService.V1.Stations>(),
            )
            .set(httpContexts.cache, [url, this.cacheTtl]),
        }),
      );
    },

    fetchStation: (stationId: string): Promise<DwdService.V1.Station> => {
      let url = `${URL}/v1/${stationId}`;
      return firstValueFrom(
        this.http.get<DwdService.V1.Station>(url, {
          context: new HttpContext()
            .set(
              httpContexts.validateType,
              typia.createValidate<DwdService.V1.Station>(),
            )
            .set(httpContexts.cache, [url, this.cacheTtl]),
        }),
      );
    },

    fetchData: (parameters: {
      stationId: string;
      dataType: string;
      granularity: string;
      from?: Dayjs;
      until?: Dayjs;
    }): Promise<DwdService.V1.Data> => {
      let {stationId, dataType, granularity, from, until} = parameters;
      let url = `${URL}/v1/${stationId}/${dataType}/${granularity}`;
      let params = new HttpParams();
      if (from) params = params.set("from", from.unix());
      if (until) params = params.set("until", until.unix());
      return firstValueFrom(
        this.http.get<DwdService.V1.Data>(url, {
          params,
          context: new HttpContext()
            .set(
              httpContexts.validateType,
              typia.createValidate<DwdService.V1.Data>(),
            )
            .set(httpContexts.cache, [url + params.toString(), this.cacheTtl]),
        }),
      );
    },
  };
}

export namespace DwdService {
  export namespace V1 {
    export type Station = {
      id: string;
      name: string;
      state: string;
      location: Record<string, unknown>;
      height: number;
      historical: boolean;
      capabilities: Array<{
        dataType: string;
        resolution:
          | "1_minute"
          | "5_minutes"
          | "10_minutes"
          | "hourly"
          | "subdaily"
          | "daily"
          | "monthly"
          | "annual"
          | "multi_annual";
        availableFrom: string;
        availableUntil: string;
      }>;
    };

    export type Stations = DwdService.V1.Station[];

    export type Data = {
      timeseries: Array<{
        ts: string;
        [key: string]: any;
      }> | null;
      metadata: Array<{
        name: string;
        description: string;
        unit: string;
        availableFrom: string;
        availableUntil: string;
      }>;
    };
  }

  export namespace V2 {
    export type Stations = FeatureCollection<
      Point,
      {
        id: string;
        name: string;
        products: Record<
          string,
          Partial<
            Record<
              | "annual"
              | "monthly"
              | "daily"
              | "subDaily"
              | "hourly"
              | "every10Minutes"
              | "every5Minutes"
              | "everyMinute",
              {from: string; until: string}
            >
          >
        >;
      }
    >;
  }
}
