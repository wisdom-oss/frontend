import {
  HttpClient,
  HttpContext,
  HttpDownloadProgressEvent,
  HttpHeaderResponse,
  HttpResponse,
  HttpEventType,
} from "@angular/common/http";
import {Injectable} from "@angular/core";
import {JTDDataType} from "ajv/dist/core";
import dayjs from "dayjs";
import {GeoJsonObject} from "geojson";
import {firstValueFrom, Observable, BehaviorSubject} from "rxjs";

import {httpContexts} from "../common/http-contexts";
import {Once} from "../common/utils/once";

const URL = "/api/water-rights" as const;

@Injectable({
  providedIn: "root",
})
export class WaterRightsService {
  constructor(private http: HttpClient) {}

  fetchUsageLocations(): {
    progress: Observable<number>;
    total: PromiseLike<number | null>;
    data: PromiseLike<WaterRightsService.UsageLocations>;
  } {
    let progress = new BehaviorSubject(0);
    let total = new Once<number | null>();
    let data = new Once<WaterRightsService.UsageLocations>();

    let url = `${URL}/`;
    this.http
      .get<WaterRightsService.UsageLocations>(url, {
        observe: "events",
        reportProgress: true,
        context: new HttpContext().set(
          httpContexts.validateSchema,
          USAGE_LOCATIONS,
        ),
        // TODO: insert cache again when content length is done
        // .set(httpContexts.cache, [url, dayjs.duration(3, "days")]),
      })
      .subscribe(event => {
        console.debug(event);
        switch (event.type) {
          case HttpEventType.ResponseHeader:
            // TODO: check if content-length needs to be check or total of progress event is enough
            event as HttpHeaderResponse;
            let contentLengthHeader =
              event.headers.get("content-length") ??
              event.headers.get("x-content-length");
            if (!contentLengthHeader) return total.set(null);
            let contentLength = parseInt(contentLengthHeader);
            if (Number.isNaN(contentLength)) return total.set(null);
            total.set(contentLength);
            break;
          case HttpEventType.DownloadProgress:
            event as HttpDownloadProgressEvent;
            progress.next(event.loaded);
            break;
          case HttpEventType.Response:
            event as HttpResponse<WaterRightsService.UsageLocations>;
            data.set(event.body ?? []);
            break;
        }
      });

    return {data, progress, total};
  }

  fetchWaterRightDetails(
    no: number,
  ): Promise<WaterRightsService.WaterRightDetails> {
    let url = `${URL}/details/${no}`;
    return firstValueFrom(
      this.http.get<WaterRightsService.WaterRightDetails>(url, {
        context: new HttpContext()
          .set(httpContexts.validateSchema, WATER_RIGHT_DETAILS)
          .set(httpContexts.cache, [url, dayjs.duration(3, "days")]),
      }),
    );
  }

  fetchAverageWithdrawals(
    ...geometries: GeoJsonObject[]
  ): Promise<WaterRightsService.AverageWithdrawals> {
    let url = `${URL}/average-withdrawals`;
    let context = new HttpContext().set(
      httpContexts.validateSchema,
      AVERAGE_WITHDRAWALS,
    );
    return firstValueFrom(
      this.http.post<WaterRightsService.AverageWithdrawals>(url, geometries, {
        context,
      }),
    );
  }
}

export namespace WaterRightsService {
  export type AverageWithdrawals = JTDDataType<typeof AVERAGE_WITHDRAWALS>;
  export type UsageLocations = JTDDataType<typeof USAGE_LOCATIONS>;
  export type WaterRightDetails = JTDDataType<typeof WATER_RIGHT_DETAILS>;
}

const KEY_VALUE = {
  properties: {},
  optionalProperties: {
    key: {type: "uint32"},
    value: {type: "string"},
  },
} as const;

const RATES = {
  elements: {
    properties: {
      value: {type: "float64"},
      unit: {type: "string"},
      per: {
        properties: {
          // numbers here should be 64 bit, but ajv can't, so floats
          Microseconds: {type: "float64"},
          Days: {type: "float64"},
          Months: {type: "float64"},
          Valid: {type: "boolean"},
        },
      },
    },
  },
} as const;

const QUANTITY = {
  properties: {
    value: {type: "float64"},
    unit: {type: "string"},
  },
} as const;

const USAGE_LOCATIONS = {
  elements: {
    properties: {
      id: {type: "uint32"},
      legalDepartment: {enum: ["A", "B", "C", "D", "E", "F", "K", "L"]},
    },
    optionalProperties: {
      no: {type: "uint32"},
      serial: {type: "string"},
      waterRight: {type: "uint32"},
      active: {type: "boolean"},
      real: {type: "boolean"},
      name: {type: "string"},
      legalPurpose: {elements: {type: "string"}},
      mapExcerpt: KEY_VALUE,
      municipalArea: KEY_VALUE,
      county: {type: "string"},
      landRecord: {
        properties: {},
        optionalProperties: {
          district: {type: "string"},
          field: {type: "uint32"},
          fallback: {type: "string"},
        },
      },
      plot: {type: "string"},
      maintenanceAssociation: KEY_VALUE,
      euSurveyArea: KEY_VALUE,
      catchmentAreaCode: KEY_VALUE,
      regulationCitation: {type: "string"},
      withdrawalRates: RATES,
      pumpingRates: RATES,
      injectionRates: RATES,
      wasteWaterFlowVolume: RATES,
      riverBasin: {type: "string"},
      groundwaterBody: {type: "string"},
      waterBody: {type: "string"},
      floodArea: {type: "string"},
      waterProtectionArea: {type: "string"},
      damTargetLevels: {
        properties: {},
        optionalProperties: {
          default: QUANTITY,
          steady: QUANTITY,
          max: QUANTITY,
        },
      },
      fluidDischarge: RATES,
      rainSupplement: RATES,
      irrigationArea: QUANTITY,
      phValues: {
        values: {
          type: "float64",
        },
      },
      injectionLimits: {
        elements: {
          properties: {
            substance: {type: "string"},
            quantity: {
              properties: {
                value: {type: "float64"},
                unit: {type: "string"},
              },
            },
          },
        },
      },
      location: {
        properties: {
          type: {enum: ["Point"]},
          coordinates: {elements: {type: "float64"}},
        },
      },
    },
  },
} as const;

const WATER_RIGHT_DETAILS = {
  properties: {
    "water-right": {
      properties: {},
      optionalProperties: {
        id: {type: "uint32"},
        waterRightNumber: {type: "uint32"},
        holder: {type: "string"},
        validFrom: {type: "string"},
        validUntil: {type: "string"},
        status: {type: "string"},
        legalTitle: {type: "string"},
        waterAuthority: {type: "string"},
        registeringAuthority: {type: "string"},
        grantingAuthority: {type: "string"},
        initiallyGranted: {type: "string"},
        lastChange: {type: "string"},
        fileReference: {type: "string"},
        externalIdentifier: {type: "string"},
        subject: {type: "string"},
        address: {type: "string"},
        legalDepartments: {
          elements: {
            enum: ["A", "B", "C", "D", "E", "F", "K", "L"],
          },
        },
        annotation: {type: "string"},
      },
    },
    "usage-locations": USAGE_LOCATIONS,
  },
} as const;

const AVERAGE_WITHDRAWALS = {
  properties: {
    minimalWithdrawal: {type: "float64"},
    maximalWithdrawal: {type: "float64"},
  },
} as const;
