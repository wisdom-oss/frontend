import {HttpClient, HttpContext} from "@angular/common/http";
import {Injectable} from "@angular/core";
import {JTDDataType} from "ajv/dist/core";
import {Point} from "geojson";
import {firstValueFrom} from "rxjs";

import {typeUtils} from "../common/type-utils";
import {httpContexts} from "../common/http-contexts";

const URL = "/api/groundwater-levels" as const;

@Injectable({
  providedIn: "root",
})
export class GroundwaterLevelsService {
  constructor(private http: HttpClient) {}

  fetchRecorderLocation(
    stationId: string,
  ): Promise<GroundwaterLevelsService.RecorderLocation> {
    return firstValueFrom(
      this.http.get<GroundwaterLevelsService.RecorderLocation>(
        `${URL}/${stationId}`,
        {
          context: new HttpContext().set(
            httpContexts.validateSchema,
            RECORDER_LOCATION,
          ),
        },
      ),
    );
  }

  fetchRecorderLocations(): Promise<GroundwaterLevelsService.RecorderLocations> {
    return firstValueFrom(
      this.http.get<GroundwaterLevelsService.RecorderLocations>(`${URL}/`, {
        context: new HttpContext().set(
          httpContexts.validateSchema,
          RECORDER_LOCATIONS,
        ),
      }),
    );
  }
}

export namespace GroundwaterLevelsService {
  export type RecorderLocation = Omit<
    JTDDataType<typeof RECORDER_LOCATION>,
    "location"
  > & {location: Point};
  export type RecorderLocations = typeUtils.UpdateElements<
    JTDDataType<typeof RECORDER_LOCATIONS>,
    "location",
    {location: Point}
  >;
}

const RECORDER_LOCATION = {
  properties: {
    websiteID: {type: "string"},
    publicID: {type: "string"},
    name: {type: "string"},
    operator: {type: "string"},
    location: {
      optionalProperties: {},
      additionalProperties: true,
    },
  },
} as const;

const RECORDER_LOCATIONS = {
  elements: RECORDER_LOCATION,
} as const;
