import {HttpClient, HttpContext} from "@angular/common/http";
import {Injectable} from "@angular/core";
import {JTDDataType} from "ajv/dist/core";
import dayjs from "dayjs";
import {GeoJsonObject} from "geojson";
import {firstValueFrom} from "rxjs";

import {httpContexts} from "../common/http-contexts";

const URL = "/api/water-rights" as const;

@Injectable({
  providedIn: "root",
})
export class WaterRightsServiceService {
  constructor(private http: HttpClient) {}

  fetchUsageLocations(): Promise<WaterRightsServiceService.UsageLocations> {
    let url = `${URL}/`;
    return firstValueFrom(
      this.http.get<WaterRightsServiceService.UsageLocations>(url, {
        context: new HttpContext()
          .set(httpContexts.validateSchema, USAGE_LOCATIONS)
          .set(httpContexts.cache, [url, dayjs.duration(3, "days")]),
      }),
    );
  }

  fetchAverageWithdrawals(
    ...geometries: GeoJsonObject[]
  ): Promise<WaterRightsServiceService.AverageWithdrawals> {
    let url = `${URL}/average-withdrawals`;
    let context = new HttpContext().set(
      httpContexts.validateSchema,
      AVERAGE_WITHDRAWALS,
    );
    return firstValueFrom(
      this.http.post<WaterRightsServiceService.AverageWithdrawals>(
        url,
        geometries,
        {context},
      ),
    );
  }
}

export namespace WaterRightsServiceService {
  export type AverageWithdrawals = JTDDataType<typeof AVERAGE_WITHDRAWALS>;
  export type UsageLocations = JTDDataType<typeof USAGE_LOCATIONS>;
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
      per: {type: "float64"},
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
          coordinates: {elements: {type: "uint32"}},
        },
      },
    },
  },
} as const;

const AVERAGE_WITHDRAWALS = {
  properties: {
    minimalWithdrawal: {type: "float64"},
    maximalWithdrawal: {type: "float64"},
  },
} as const;
