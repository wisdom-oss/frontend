import {HttpClient, HttpContext} from "@angular/common/http";
import {Injectable} from "@angular/core";
import {JTDDataType} from "ajv/dist/core";
import dayjs, {Dayjs} from "dayjs";
import {Point} from "geojson";
import {firstValueFrom} from "rxjs";

import {typeUtils} from "../common/utils/type-utils";
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

  async fetchMeasurementClassifications(
    date: Dayjs = dayjs(),
  ): Promise<Record<string, GroundwaterLevelsService.Measurement>> {
    let url = `${URL}/graphql`;
    let query = `{
      measurements(
        from: "${date.toISOString()}"
        until: "${date.toISOString()}"
      ) {
        station
        date
        classification
        waterLevelNHN
        waterLevelGOK
      }
    }`;

    let context = new HttpContext()
      .set(httpContexts.validateSchema, MEASUREMENT_CLASSIFICATIONS_RESPONSE)
      .set(httpContexts.cache, [`${url}:${query}`, dayjs.duration(8, "hours")]);

    let response = await firstValueFrom(
      this.http.post<JTDDataType<typeof MEASUREMENT_CLASSIFICATIONS_RESPONSE>>(
        url,
        {query},
        {context},
      ),
    );

    let measurements = response.data.measurements.map(m => ({
      station: m.station,
      date: dayjs(m.date),
      classification: m.classification || null,
      waterLevelNHN: m.waterLevelNHN,
      waterLevelGOK: m.waterLevelGOK,
    }));

    return Object.fromEntries(measurements.map(m => [m.station, m]));
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
  export type Measurement = Omit<
    JTDDataType<
      (typeof MEASUREMENT_CLASSIFICATIONS_RESPONSE)["properties"]["data"]["properties"]["measurements"]["elements"]
    >,
    "classification" | "date"
  > & {classification: MeasurementClassification | null; date: Dayjs};

  /**
   * Measurement classifications according to NLWKN.
   *
   * @link https://www.grundwasserstandonline.nlwkn.niedersachsen.de/Hinweis#einstufungGrundwasserstandsklassen
   */
  export enum MeasurementClassification {
    MAX_EXCEEDED = "Höchstwert überschritten",
    VERY_HIGH = "sehr hoch",
    HIGH = "hoch",
    NORMAL = "normal",
    LOW = "niedrig",
    VERY_LOW = "sehr niedrig",
    MIN_UNDERSHOT = "Niedrigstwert unterschritten",
  }
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

const MC = GroundwaterLevelsService.MeasurementClassification;
const MEASUREMENT_CLASSIFICATIONS_RESPONSE = {
  properties: {
    data: {
      properties: {
        measurements: {
          elements: {
            properties: {
              station: {type: "string"},
              date: {type: "timestamp"},
              classification: {
                enum: [
                  MC.MAX_EXCEEDED,
                  MC.VERY_HIGH,
                  MC.HIGH,
                  MC.NORMAL,
                  MC.LOW,
                  MC.VERY_LOW,
                  MC.MIN_UNDERSHOT,
                  "",
                ],
              },
            },
            optionalProperties: {
              waterLevelNHN: {type: "float64", nullable: true},
              waterLevelGOK: {type: "float64", nullable: true},
            },
          },
        },
      },
    },
  },
} as const;
