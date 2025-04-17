import {HttpClient, HttpContext} from "@angular/common/http";
import {Injectable} from "@angular/core";
import {JTDDataType} from "ajv/dist/core";
import dayjs from "dayjs";
import {firstValueFrom} from "rxjs";

import {httpContexts} from "../common/http-contexts";

const URL = "/api/dwd" as const;

@Injectable({
  providedIn: "root",
})
export class DwdService {
  constructor(private http: HttpClient) {}

  readonly v2 = {
    fetchStations: (): Promise<DwdService.V2.Stations> => {
      let url = `${URL}/v2/stations`;
      return firstValueFrom(
        this.http.get<DwdService.V2.Stations>(url, {
          context: new HttpContext()
            .set(httpContexts.validateSchema, V2_STATIONS)
            .set(httpContexts.cache, [url, dayjs.duration(12, "hours")]),
        }),
      );
    },
  };

  readonly v1 = {};
}

export namespace DwdService {
  export namespace V2 {
    export type Stations = JTDDataType<typeof V2_STATIONS>;
  }
}

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
