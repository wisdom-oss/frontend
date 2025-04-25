import {HttpClient, HttpContext, HttpParams} from "@angular/common/http";
import {Injectable} from "@angular/core";
import {JTDDataType} from "ajv/dist/core";
import dayjs, {Dayjs} from "dayjs";
import {firstValueFrom} from "rxjs";

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
            .set(httpContexts.validateSchema, V2_STATIONS)
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
            .set(httpContexts.validateSchema, V1_STATIONS)
            .set(httpContexts.cache, [url, this.cacheTtl]),
        }),
      );
    },

    fetchStation: (stationId: string): Promise<DwdService.V1.Station> => {
      let url = `${URL}/v1/${stationId}`;
      return firstValueFrom(
        this.http.get<DwdService.V1.Station>(url, {
          context: new HttpContext()
            .set(httpContexts.validateSchema, V1_STATION)
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
            .set(httpContexts.validateSchema, V1_DATA)
            .set(httpContexts.cache, [url + params.toString(), this.cacheTtl]),
        }),
      );
    },
  };
}

export namespace DwdService {
  export namespace V1 {
    export type Station = JTDDataType<typeof V1_STATION>;
    export type Stations = JTDDataType<typeof V1_STATIONS>;
    export type Data = JTDDataType<typeof V1_DATA>;
  }

  export namespace V2 {
    export type Stations = JTDDataType<typeof V2_STATIONS>;
  }
}

const V1_STATION = {
  properties: {
    id: {type: "string"},
    name: {type: "string"},
    state: {type: "string"},
    location: {
      properties: {},
      additionalProperties: true,
    },
    height: {type: "int32"},
    historical: {type: "boolean"},
    capabilities: {
      elements: {
        properties: {
          dataType: {type: "string"},
          resolution: {
            enum: [
              "1_minute",
              "5_minutes",
              "10_minutes",
              "hourly",
              "subdaily",
              "daily",
              "monthly",
              "annual",
              "multi_annual",
            ],
          },
          availableFrom: {type: "string"},
          availableUntil: {type: "string"},
        },
      },
    },
  },
} as const;

const V1_STATIONS = {
  elements: V1_STATION,
} as const;

const V1_DATA = {
  properties: {
    timeseries: {
      elements: {
        properties: {
          // we don't have int64
          ts: {type: "string"},
        },
        additionalProperties: true,
      },
      nullable: true,
    },
    metadata: {
      elements: {
        properties: {
          name: {type: "string"},
          description: {type: "string"},
          unit: {type: "string"},
          availableFrom: {type: "string"},
          availableUntil: {type: "string"},
        },
      },
    },
  },
} as const;

const V2_STATIONS = {
  properties: {
    type: {enum: ["FeatureCollection"]},
    features: {
      elements: {
        properties: {
          type: {enum: ["Feature"]},
          id: {type: "string"},
          geometry: {
            properties: {
              type: {enum: ["Point"]},
              coordinates: {
                elements: {type: "float64"},
              },
            },
          },
          properties: {
            properties: {
              id: {type: "string"},
              name: {type: "string"},
              products: {
                values: {
                  optionalProperties: {
                    annual: {
                      properties: {
                        from: {type: "string"},
                        until: {type: "string"},
                      },
                    },
                    monthly: {
                      properties: {
                        from: {type: "string"},
                        until: {type: "string"},
                      },
                    },
                    daily: {
                      properties: {
                        from: {type: "string"},
                        until: {type: "string"},
                      },
                    },
                    subDaily: {
                      properties: {
                        from: {type: "string"},
                        until: {type: "string"},
                      },
                    },
                    hourly: {
                      properties: {
                        from: {type: "string"},
                        until: {type: "string"},
                      },
                    },
                    every10Minutes: {
                      properties: {
                        from: {type: "string"},
                        until: {type: "string"},
                      },
                    },
                    every5Minutes: {
                      properties: {
                        from: {type: "string"},
                        until: {type: "string"},
                      },
                    },
                    everyMinute: {
                      properties: {
                        from: {type: "string"},
                        until: {type: "string"},
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
} as const;
