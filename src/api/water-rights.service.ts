import {
  HttpClient,
  HttpContext,
  HttpDownloadProgressEvent,
  HttpResourceRef,
  HttpHeaderResponse,
  HttpResponse,
  HttpEventType,
} from "@angular/common/http";
import {Injectable, Signal} from "@angular/core";
import {parseMultipart} from "@mjackson/multipart-parser";
import dayjs from "dayjs";
import {GeoJsonObject, Point} from "geojson";
import {firstValueFrom, Observable, BehaviorSubject} from "rxjs";
import typia from "typia";

import {httpContexts} from "../common/http-contexts";
import {Once} from "../common/utils/once";
import {typeUtils} from "../common/utils/type-utils";
import {api} from "../common/api";

const URL = "/api/water-rights/v1" as const;

@Injectable({
  providedIn: "root",
})
export class WaterRightsService {
  constructor(private http: HttpClient) {}

  fetchUsageLocations(): api.Signal<Self.UsageLocation[]> {
    return api.resource({
      url: `${URL}/`,
      validate: typia.createValidate<Self.UsageLocation[]>(),
    });
  }

  fetchWaterRightDetails(
    no: api.RequestSignal<number>,
  ): api.Signal<Self.WaterRightDetails | undefined> {
    let parse = (content: string): Self.WaterRightDetails => {
      let waterRight: any = undefined;
      let usageLocations: any = undefined;

      // usually we get the boundary from the headers, but we cannot access 
      // that yet
      let boundary = content.trim().split("\n")[0].trim().split("--")[1];
      let uint8Array = new TextEncoder().encode(content);
      for (let part of parseMultipart(uint8Array, {boundary})) {
        switch (part.name) {
          case "water-right":
            waterRight = JSON.parse(part.text);
            break;
          case "usage-locations":
            usageLocations = JSON.parse(part.text);
            break;
          default:
            throw new Error("unexpected multipart name: " + part.name);
        }
      }

      if (!waterRight) throw new Error("did not get water rights");
      if (!usageLocations) throw new Error("did not get usage locations");
      return {waterRight, usageLocations};
    };

    return  api.resource({
      url: api.url`${URL}/details/${no}`,
      responseType: "text",
      validateRaw: typia.createValidate<string>(),
      validate: typia.createValidate<Self.WaterRightDetails>(),
      parse,
    });
  }

  fetchAverageWithdrawals(
    geometries: api.RequestSignal<GeoJsonObject[]>,
  ): api.Signal<Self.AverageWithdrawals> {
    return api.resource({
      url: `${URL}/average-withdrawals`,
      validate: typia.createValidate<WaterRightsService.AverageWithdrawals>(),
      body: geometries,
      method: "POST",
    });
  }
}

export namespace WaterRightsService {
  export type AverageWithdrawals = {
    minimalWithdrawal: number & typia.tags.Type<"double">;
    maximalWithdrawal: number & typia.tags.Type<"double">;
  };

  export namespace Helper {
    export type KeyValue = {
      key: number;
      value?: string;
    };

    export type Quantity = {
      value: number;
      unit: string;
    };

    export type Rate = Quantity & {
      per: {
        Microseconds: number & typia.tags.Type<"uint64">;
        Days: number & typia.tags.Type<"uint32">;
        Months: number & typia.tags.Type<"uint32">;
        Valid: boolean;
      };
    };
  }

  export type UsageLocation = {
    id: number & typia.tags.Type<"uint32">;
    legalDepartment: "A" | "B" | "C" | "D" | "E" | "F" | "K" | "L";
  } & typeUtils.Uncertain<{
    no: number & typia.tags.Type<"uint32">;
    serial: string;
    waterRight: number & typia.tags.Type<"uint32">;
    active: boolean;
    real: boolean;
    name: string;
    legalPurpose: [string, string];
    mapExcerpt: Helper.KeyValue;
    municipalArea: Helper.KeyValue;
    county: string;
    landRecord: {district: string; field: number} | {fallback: string};
    plot: string;
    maintenanceAssociation: Helper.KeyValue;
    euSurveyArea: Helper.KeyValue;
    catchmentAreaCode: Helper.KeyValue;
    regulationCitation: string;
    withdrawalRates: Helper.Rate[];
    pumpingRates: Helper.Rate[];
    injectionRates: Helper.Rate[];
    wasteWaterFlowVolume: Helper.Rate[];
    riverBasin: string;
    groundwaterBody: string;
    waterBody: string;
    floodArea: string;
    waterProtectionArea: string;
    damTargetLevel: {
      default?: Helper.Quantity;
      steady?: Helper.Quantity;
      max?: Helper.Quantity;
    };
    fluidDischarge: Helper.Rate[];
    rainSupplement: Helper.Rate[];
    irrigationArea: Helper.Quantity;
    phValue: Record<string, number>;
    injectionLimits: {substance: string; quantity: Helper.Quantity}[];
    location: Point;
  }>;

  export type WaterRightDetails = {
    waterRight: typeUtils.Uncertain<{
      id: number & typia.tags.Type<"uint32">;
      water_right_number: number & typia.tags.Type<"uint32">;
      holder: string;
      validFrom: string;
      validUntil: string;
      status: "aktiv" | "inaktiv" | "Wasserbuchblatt";
      legalTitle: string;
      waterAuthority: string;
      registeringAuthority: string;
      grantingAuthority: string;
      initiallyGranted: string;
      lastChange: string;
      fileReference: string;
      externalIdentifier: string;
      subject: string;
      address: string;
      legalDepartments: UsageLocation["legalDepartment"][] &
        typia.tags.UniqueItems;
      annotation: string;
    }>;
    usageLocations: UsageLocation[];
  };
}

import Self = WaterRightsService;
