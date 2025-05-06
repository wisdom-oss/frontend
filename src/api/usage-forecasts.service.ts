import {HttpClient, HttpContext, HttpParams} from "@angular/common/http";
import {Injectable} from "@angular/core";
import dayjs from "dayjs";
import {firstValueFrom} from "rxjs";
import typia from "typia";

import {httpContexts} from "../common/http-contexts";

const URL = "/api/water-usage-forecasts" as const;

@Injectable({
  providedIn: "root",
})
export class UsageForecastsService {
  constructor(private http: HttpClient) {}

  fetchAvailableAlgorithms(): Promise<AvailableAlgorithms> {
    return firstValueFrom(
      this.http.get<AvailableAlgorithms>(`${URL}/`, {
        context: new HttpContext()
          .set(httpContexts.cache, [URL, dayjs.duration(1, "day")])
          .set(
            httpContexts.validateType,
            typia.createValidate<AvailableAlgorithms>(),
          ),
      }),
    );
  }

  fetchForecast(
    scriptIdentifier: string,
    key: string | string[],
    options?: {
      consumerGroup?: null | ConsumerGroup | ConsumerGroup[];
      parameters?: null | Record<string, any>;
    } | null,
  ): Promise<Result> {
    let params = new HttpParams(); // remember, params operations are always copy
    for (let paramKey of [key].flat()) params = params.append("key", paramKey);
    for (let consumerGroupKey of [options?.consumerGroup ?? []].flat()) {
      params = params.append("consumerGroup", consumerGroupKey);
    }

    let formData: FormData | undefined = undefined;
    if (options?.parameters && Object.values(options.parameters).length) {
      formData = new FormData();
      for (let [key, value] of Object.entries(options.parameters)) {
        formData.append(key, value);
      }
    }

    let context = new HttpContext()
      .set(httpContexts.validateType, typia.createValidate<Result>())
      .set(httpContexts.cache, [
        JSON.stringify({URL, key, scriptIdentifier, options}),
        dayjs.duration(1, "day"),
      ]);

    return firstValueFrom(
      this.http.post<Result>(`${URL}/${scriptIdentifier}`, formData, {
        params,
        context,
      }),
    );
  }
}

type ConsumerGroup = UsageForecastsService.ConsumerGroup;
type AvailableAlgorithms = UsageForecastsService.AvailableAlgorithms;
type Result = UsageForecastsService.Result;

export namespace UsageForecastsService {
  export type ConsumerGroup =
    | "businesses"
    | "households"
    | "small_businesses"
    | "agriculture_forestry_fisheries"
    | "public_institutions"
    | "standpipes"
    | "tourism"
    | "resellers";

  export type AvailableAlgorithms = Array<{
    identifier: string;
    displayName: string;
    description: string;
    parameter: Record<
      string,
      | {
          type: "str";
          default: string;
          description: string;
          enums?: string[];
        }
      | {
          type: "int";
          default: number & typia.tags.Type<"int32">;
          description: string;
          max?: number & typia.tags.Type<"int32">;
          min?: number & typia.tags.Type<"int32">;
        }
      | {
          type: "float";
          default: number & typia.tags.Type<"double">;
          description: string;
          max?: number & typia.tags.Type<"double">;
          min?: number & typia.tags.Type<"double">;
        }
    >;
  }>;

  export type Result = {
    meta: {
      rScores: Record<string, number & typia.tags.Type<"double">>;
      realDataUntil: Record<string, number & typia.tags.Type<"uint32">>;
      curves?: Record<string, string>;
    };
    data: Array<{
      label: string;
      x: string | number;
      y: number & typia.tags.Type<"double">;
      uncertainty?: (number & typia.tags.Type<"double">)[];
    }>;
  };
}
