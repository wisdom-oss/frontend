import {HttpClient} from "@angular/common/http";
import {Injectable} from "@angular/core";
import {JTDDataType} from "ajv/dist/core";
import {Point} from "geojson";

import {typeUtils} from "../common/type-utils";

@Injectable({
  providedIn: "root",
})
export class GroundwaterLevelsService {
  constructor(private http: HttpClient) {}
}

export namespace GroundwaterLevelsService {
  export type RecorderLocations = typeUtils.UpdateElements<
    JTDDataType<typeof RECORDER_LOCATIONS>,
    "location",
    {location: Point}
  >;
}

const RECORDER_LOCATIONS = {
  elements: {
    optionalProperties: {
      websiteID: {type: "string"},
      publicID: {type: "string"},
      name: {type: "string"},
      operator: {type: "string"},
      location: {
        optionalProperties: {},
        additionalProperties: true,
      },
    },
  },
} as const;
