import {HttpClient, HttpContext, HttpParams} from "@angular/common/http";
import {computed, inject, Injectable} from "@angular/core";
import dayjs, {Dayjs} from "dayjs";
import {FeatureCollection, Point} from "geojson";
import {firstValueFrom} from "rxjs";
import typia from "typia";
import {api} from "../common/api";import { parameter } from "typia/lib/http";
import { s } from "../common/s.tag";
import {httpContexts} from "../common/http-contexts";

const URL = "/api/dwd" as const;

@Injectable({
  providedIn: "root",
})
export class DwdService {
  private cacheTtl = dayjs.duration(12, "hours");
  private http = inject(HttpClient);

  readonly v2 = {
    fetchStations: (): api.Signal<Self.V2.Stations> =>
      api.resource({
        url: `${URL}/v2/stations`,
        validate: typia.createValidate<Self.V2.Stations>(),
        cache: this.cacheTtl,
      }),
  };

  readonly v1 = {
    fetchStations: (): api.Signal<Self.V1.Stations> =>
      api.resource({
        url: `${URL}/v2/`,
        validate: typia.createValidate<Self.V1.Stations>(),
        cache: this.cacheTtl,
      }),

    fetchData: (parameters: {
      stationId: api.MaybeSignal<string>,
      dataType: api.MaybeSignal<string>,
      granularity: api.MaybeSignal<string>,
      from?: api.MaybeSignal<Dayjs | undefined>,
      until?: api.MaybeSignal<Dayjs | undefined>,
    }): api.Signal<Self.V1.Data> => {
      let {stationId, dataType, granularity} = parameters;
      let url = s`${URL}/v1/${stationId}/${dataType}/${granularity}`;
      let params = computed(() => {
        let params = new HttpParams();
        let from = api.toSignal(parameters.from)();
        if (from) params = params.set("from", from.unix())
        let until = api.toSignal(parameters.until)();
        if (until) params = params.set("until", until.unix());
        return params;
      });

      return api.resource({
        url,
        body: params,
        validate: typia.createValidate<Self.V1.Data>(),
        cache: this.cacheTtl,
      });
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

import Self = DwdService;
