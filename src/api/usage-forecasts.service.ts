import {HttpParams} from "@angular/common/http";
import {Injectable} from "@angular/core";
import dayjs from "dayjs";
import typia from "typia";

import {api} from "../common/api";

const URL = "/api/water-usage-forecasts" as const;

@Injectable({
  providedIn: "root",
})
export class UsageForecastsService {
  fetchAvailableAlgorithms(): api.Signal<Self.AvailableAlgorithms> {
    return api.resource({
      url: `${URL}/`,
      validate: typia.createValidate<Self.AvailableAlgorithms>(),
      cache: dayjs.duration(1, "day"),
    });
  }

  fetchForecast(
    options: api.RequestSignal<{
      scriptIdentifier: string;
      key: string | string[];
      options?: {
        consumerGroup?: null | Self.ConsumerGroup | Self.ConsumerGroup[];
        parameters?: null | Record<string, any>;
      } | null;
    }>,
  ): api.Signal<Self.Result> {
    let params = api.map(options, options => {
      let params = new HttpParams();
      for (let key of [options.key].flat()) params = params.append("key", key);
      for (let key of [options?.options?.consumerGroup ?? []].flat()) {
        params = params.append("consumerGroup", key);
      }

      return params;
    });

    let formData = api.map(options, ({options}) => {
      if (!(options?.parameters && Object.values(options.parameters).length))
        return api.NONE;

      let formData = new FormData();
      for (let [key, value] of Object.entries(options.parameters)) {
        formData.append(key, value);
      }

      return formData;
    });

    let scriptIdentifier = api.map(
      options,
      ({scriptIdentifier}) => scriptIdentifier,
    );

    return api.resource({
      method: "POST",
      url: api.url`${URL}/${scriptIdentifier}`,
      validate: typia.createValidate<Self.Result>(),
      cache: dayjs.duration(1, "day"),
      params,
      body: formData,
    });
  }
}

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

import Self = UsageForecastsService;
