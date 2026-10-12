import {Service} from "@angular/core";
import {Dayjs} from "dayjs";
import {Duration} from "dayjs/plugin/duration";
import typia, {tags} from "typia";

import {api} from "../../common/api";

const URL = "/api/files/v1/public/idw-radar" as const;

@Service()
export class RadarDataService {
  fetchManifest(): api.Signal<Self.Manifest> {
    return api.resource({
      url: `${URL}/radar_manifest.json`,
      validateRaw: typia.createValidate<Raw.Manifest>(),
      parse: () => null as any,
    });
  }
}

namespace Raw {
  export type Manifest = {
    folderPath: string & tags.Format<"uri-reference">;
    start: string & tags.Format<"date-time">;
    end: string & tags.Format<"date-time">;
    stepSize: string & tags.Format<"duration">;
    imageUseISO8601: boolean;
    bbox: [
      number & tags.Type<"double">,
      number & tags.Type<"double">,
      number & tags.Type<"double">,
      number & tags.Type<"double">,
    ];
  };
}

export namespace RadarDataService {
  export type Manifest = {
    folderPath: Raw.Manifest["folderPath"];
    start: Dayjs;
    end: Dayjs;
    stepSize: Duration;
    imageUseISO8601: true;
    bbox: Raw.Manifest["bbox"];
  };
}

import Self = RadarDataService;
