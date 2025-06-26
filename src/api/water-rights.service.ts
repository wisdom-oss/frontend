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
import dayjs from "dayjs";
import {GeoJsonObject, Point} from "geojson";
import {firstValueFrom, Observable, BehaviorSubject} from "rxjs";
import typia from "typia";

import {httpContexts} from "../common/http-contexts";
import {Once} from "../common/utils/once";
import {typeUtils} from "../common/utils/type-utils";

const URL = "/api/water-rights/v1" as const;

@Injectable({
  providedIn: "root",
})
export class WaterRightsService {
  constructor(private http: HttpClient) {}

  fetchUsageLocations(): {
    progress: Observable<number>;
    total: PromiseLike<number | null>;
    data: PromiseLike<WaterRightsService.UsageLocation[]>;
  } {
    let progress = new BehaviorSubject(0);
    let total = new Once<number | null>();
    let data = new Once<WaterRightsService.UsageLocation[]>();

    let url = `${URL}/`;
    this.http
      .get<WaterRightsService.UsageLocation[]>(url, {
        observe: "events",
        reportProgress: true,
        context: new HttpContext()
          .set(
            httpContexts.validateType,
            typia.createValidate<WaterRightsService.UsageLocation[]>(),
          )
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
            event as HttpResponse<WaterRightsService.UsageLocation[]>;
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
    let valid = typia.validate<WaterRightsService.WaterRightDetails>(data);
    if (!valid.success) {
      console.error(valid.errors);
      throw new Error("type validation failed");
    }
    return data;
  }

  fetchAverageWithdrawals(
    ...geometries: GeoJsonObject[]
  ): Promise<WaterRightsService.AverageWithdrawals> {
    let url = `${URL}/average-withdrawals`;
    let context = new HttpContext().set(
      httpContexts.validateType,
      typia.createValidate<WaterRightsService.AverageWithdrawals>(),
    );
    return firstValueFrom(
      this.http.post<WaterRightsService.AverageWithdrawals>(url, geometries, {
        context,
      }),
    );
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
