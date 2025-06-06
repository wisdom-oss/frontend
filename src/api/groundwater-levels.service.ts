import {HttpClient, HttpContext} from "@angular/common/http";
import {Injectable} from "@angular/core";
import dayjs, {Dayjs} from "dayjs";
import {Point} from "geojson";
import {firstValueFrom} from "rxjs";
import typia from "typia";

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
            httpContexts.validateType,
            typia.createValidate<GroundwaterLevelsService.RecorderLocation>(),
          ),
        },
      ),
    );
  }

  fetchRecorderLocations(): Promise<GroundwaterLevelsService.RecorderLocations> {
    return firstValueFrom(
      this.http.get<GroundwaterLevelsService.RecorderLocations>(`${URL}/`, {
        context: new HttpContext().set(
          httpContexts.validateType,
          typia.createValidate<GroundwaterLevelsService.RecorderLocations>(),
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
      .set(
        httpContexts.validateType,
        typia.createValidate<MeasurementClassificationResponse>(),
      )

      .set(httpContexts.cache, [`${url}:${query}`, dayjs.duration(8, "hours")]);

    let response = await firstValueFrom(
      this.http.post<MeasurementClassificationResponse>(
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

type MeasurementClassificationResponse = {
  data: {
    measurements: Array<{
      station: string;
      date: string & typia.tags.Format<"date-time">;
      classification: GroundwaterLevelsService.MeasurementClassification | "";
      waterLevelNHN?: (number & typia.tags.Type<"double">) | null;
      waterLevelGOK?: (number & typia.tags.Type<"double">) | null;
    }>;
  };
};

export namespace GroundwaterLevelsService {
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

  export type RecorderLocation = {
    websiteID: string;
    publicID: string;
    name: string;
    operator: string;
    location: Point;
  };

  export type RecorderLocations = RecorderLocation[];

  export type Measurement = Omit<
    MeasurementClassificationResponse["data"]["measurements"][0],
    "classification" | "date"
  > & {classification: MeasurementClassification | null; date: Dayjs};
}
