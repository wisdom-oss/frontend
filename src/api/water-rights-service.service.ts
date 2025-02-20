import {HttpClient, HttpContext} from "@angular/common/http";
import {Injectable} from "@angular/core";
import {JTDDataType} from "ajv/dist/core";
import {GeoJsonObject} from "geojson";
import {firstValueFrom} from "rxjs";

import {httpContexts} from "../common/http-contexts";

const URL = "/api/water-rights" as const;

@Injectable({
  providedIn: "root",
})
export class WaterRightsServiceService {
  constructor(private http: HttpClient) {}

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
}

const AVERAGE_WITHDRAWALS = {
  properties: {
    minimalWithdrawal: {type: "float64"},
    maximalWithdrawal: {type: "float64"},
  },
} as const;
