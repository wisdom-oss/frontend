import {
  HttpClient,
  HttpContext,
  HttpDownloadProgressEvent,
  HttpHeaderResponse,
  HttpResponse,
  HttpEventType,
} from "@angular/common/http";
import {Injectable} from "@angular/core";
import {parseMultipart} from "@mjackson/multipart-parser";
import {JTDDataType} from "ajv/dist/core";
import dayjs from "dayjs";
import {GeoJsonObject} from "geojson";
import {firstValueFrom, Observable, BehaviorSubject} from "rxjs";

import {httpContexts} from "../common/http-contexts";
import {Once} from "../common/utils/once";
import {SchemaValidationService} from "../core/schema/schema-validation.service";

const URL = "/api/water-rights" as const;

@Injectable({
  providedIn: "root",
})
export class WaterRightsService {
  constructor(
    private http: HttpClient,
    private schema: SchemaValidationService,
  ) {}

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
        context: new HttpContext()
          .set(httpContexts.validateSchema, USAGE_LOCATIONS)
          .set(httpContexts.cache, [url, dayjs.duration(3, "days")]),
      })
      .subscribe(event => {
        console.debug(event);
        switch (event.type) {
          case HttpEventType.ResponseHeader:
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

  async fetchWaterRightDetails(
    no: number,
  ): Promise<WaterRightsService.WaterRightDetails> {
    let url = `${URL}/details/${no}`;
    let res = await firstValueFrom(
      this.http.get(url, {responseType: "text", observe: "response"}),
    );

    let contentType = res.headers.get("content-type")?.split("; ");
    if (contentType?.[0] !== "multipart/form-data") {
      throw new Error("expected multipart/form-data");
    }

    let boundary = contentType[1].split("boundary=")[1];
    let content = res.body!;
    let endBoundary = `\r\n--${boundary}--\r\n`;
    if (!content.endsWith(endBoundary)) content += endBoundary;

    let waterRight: object | undefined = undefined;
    let usageLocations: object[] | undefined = undefined;
    let uint8Array = new TextEncoder().encode(content);
    await parseMultipart(uint8Array, {boundary}, async part => {
      switch (part.name) {
        case "water-right":
          return (waterRight = JSON.parse(await part.text()));
        case "usage-locations":
          return (usageLocations = JSON.parse(await part.text()));
        default:
          throw new Error("unexpected multipart name: " + part.name);
      }
    });

    if (!waterRight) throw new Error("did not get water rights");
    if (!usageLocations) throw new Error("did not get usage locations");

    let data = {waterRight, usageLocations};
    try {
      return this.schema.validate<WaterRightsService.WaterRightDetails>(
        WATER_RIGHT_DETAILS,
        data,
      );
    } catch (e) {
      if (e instanceof SchemaValidationService.Error) {
        console.error("expected response type is invalid", data, e.errors);
      }
      throw e;
    }
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
    waterRight: {
      properties: {},
      optionalProperties: {
        id: {type: "uint32"},
        water_right_number: {type: "uint32"},
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
    usageLocations: USAGE_LOCATIONS,
  },
} as const;

const AVERAGE_WITHDRAWALS = {
  properties: {
    minimalWithdrawal: {type: "float64"},
    maximalWithdrawal: {type: "float64"},
  },
} as const;
