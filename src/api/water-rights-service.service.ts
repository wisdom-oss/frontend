import {HttpClient, HttpContext} from "@angular/common/http";
import {Injectable} from "@angular/core";
import {GeoJsonObject} from "geojson";
import {firstValueFrom} from "rxjs";
import typia from "typia";

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
      httpContexts.validateType,
      typia.createValidate<WaterRightsServiceService.AverageWithdrawals>(),
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
  export type AverageWithdrawals = {
    minimalWithdrawal: number & typia.tags.Type<"double">;
    maximalWithdrawal: number & typia.tags.Type<"double">;
  };
}
