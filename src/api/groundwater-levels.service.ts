import {computed, Injectable} from "@angular/core";
import dayjs, {Dayjs} from "dayjs";
import {Point} from "geojson";
import typia from "typia";

import {api} from "../common/api";
import {signals} from "../common/signals";

const URL = "/api/groundwater-levels" as const;

@Injectable({
  providedIn: "root",
})
export class GroundwaterLevelsService {
  fetchRecorderLocation(
    stationId: api.RequestSignal<string>,
  ): api.Signal<Self.RecorderLocation> {
    return api.resource({
      url: api.url`${URL}/${stationId}`,
      validate: typia.createValidate<Self.RecorderLocation>(),
    });
  }

  fetchRecorderLocations(): api.Signal<Self.RecorderLocations> {
    return api.resource({
      url: `${URL}/`,
      validate: typia.createValidate<Self.RecorderLocations>(),
    });
  }

  fetchMeasurementClassifications(
    date: api.RequestSignal<Dayjs> = dayjs(),
  ): api.Signal<Record<string, Self.Measurement>> {
    let dateIso = signals.map(api.toSignal(date), date => date?.toISOString());
    let query = api.url`{
      measurements(
        from: "${dateIso}"
        until: "${dateIso}"
      ) {
        station
        date
        classification
        waterLevelNHN
        waterLevelGOK
      }
    }`;

    let parse = ({
      data: {measurements},
    }: MeasurementClassificationResponse): Record<string, Self.Measurement> => {
      return Object.fromEntries(
        measurements.map(m => [
          m.station,
          {
            station: m.station,
            date: dayjs(m.date),
            classification: m.classification || null,
            waterLevelNHN: m.waterLevelNHN,
            waterLevelGOK: m.waterLevelGOK,
          },
        ]),
      );
    };

    return api.resource({
      url: `${URL}/graphql`,
      method: "POST",
      body: computed(() => ({query: query()})),
      cache: dayjs.duration(8, "hours"),
      parse,
      validateRaw: typia.createValidate<MeasurementClassificationResponse>(),
      validate: typia.createValidate<Record<string, Self.Measurement>>(),
    });
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

import Self = GroundwaterLevelsService;
