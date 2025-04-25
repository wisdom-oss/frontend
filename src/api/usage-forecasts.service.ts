import {HttpClient, HttpContext, HttpParams} from "@angular/common/http";
import {Injectable} from "@angular/core";
import {JTDDataType} from "ajv/dist/core";
import dayjs from "dayjs";
import {firstValueFrom} from "rxjs";

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
          .set(httpContexts.validateSchema, AVAILABLE_ALGORITHMS),
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
      .set(httpContexts.validateSchema, RESULT)
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

export namespace UsageForecastsService {
  export type AvailableAlgorithms = JTDDataType<typeof AVAILABLE_ALGORITHMS>;
  export type Result = JTDDataType<typeof RESULT>;
  export type ConsumerGroup =
    | "businesses"
    | "households"
    | "small_businesses"
    | "agriculture_forestry_fisheries"
    | "public_institutions"
    | "standpipes"
    | "tourism"
    | "resellers";
}

type AvailableAlgorithms = UsageForecastsService.AvailableAlgorithms;
type Result = UsageForecastsService.Result;
type ConsumerGroup = UsageForecastsService.ConsumerGroup;

const AVAILABLE_ALGORITHMS = {
  elements: {
    properties: {
      identifier: {type: "string"},
      displayName: {type: "string"},
      description: {type: "string"},
      parameter: {
        values: {
          discriminator: "type",
          mapping: {
            str: {
              properties: {
                default: {type: "string"},
                description: {type: "string"},
              },
              optionalProperties: {
                enums: {
                  elements: {type: "string"},
                },
              },
            },
            int: {
              properties: {
                default: {type: "int32"},
                description: {type: "string"},
              },
              optionalProperties: {
                max: {type: "int32"},
                min: {type: "int32"},
              },
            },
            float: {
              properties: {
                default: {type: "float64"},
                description: {type: "string"},
              },
              optionalProperties: {
                max: {type: "float64"},
                min: {type: "float64"},
              },
            },
          },
        },
      },
    },
  },
} as const;

const RESULT = {
  properties: {
    meta: {
      properties: {
        rScores: {values: {type: "float64"}},
        realDataUntil: {values: {type: "uint32"}},
      },
      optionalProperties: {
        curves: {values: {type: "string"}},
      },
    },
    data: {
      elements: {
        properties: {
          label: {type: "string"},
          x: {type: "uint32"},
          y: {type: "float64"},
        },
        optionalProperties: {
          uncertainty: {
            elements: {
              type: "float64",
            },
          },
        },
      },
    },
  },
} as const;
