import {
  HttpClient,
  HttpStatusCode,
  HttpContext,
  HttpErrorResponse,
} from "@angular/common/http";
import {Injectable} from "@angular/core";
import {JTDDataType} from "ajv/dist/core";
import dayjs from "dayjs";
import {GeoJSON} from "geojson";
import {firstValueFrom} from "rxjs";

import {httpContexts} from "../common/http-contexts";

const URL = "/api/geodata" as const;

@Injectable({
  providedIn: "root",
})
export class GeoDataService {
  constructor(private http: HttpClient) {}

  fetchAvailableLayers(): Promise<GeoDataService.AvailableLayers> {
    return firstValueFrom(
      this.http.get<GeoDataService.AvailableLayers>(`${URL}/v2/`, {
        context: new HttpContext().set(
          httpContexts.validateSchema,
          AVAILABLE_LAYERS_SCHEMA,
        ),
      }),
    );
  }

  async fetchLayerInformation(
    layerRef: string,
  ): Promise<GeoDataService.LayerInformation | null> {
    try {
      return await firstValueFrom(
        this.http.get<GeoDataService.LayerInformation>(
          `${URL}/v2/${layerRef}`,
          {
            context: new HttpContext().set(
              httpContexts.validateSchema,
              LAYER_INFORMATION,
            ),
          },
        ),
      );
    } catch (error) {
      if (!(error instanceof HttpErrorResponse)) throw error;
      if (error.status === HttpStatusCode.NotFound) return null;
      throw error;
    }
  }

  async fetchLayerContents(
    layerRef: string,
    filter?: {
      relation: "within" | "overlaps" | "contains";
      otherLayer: string;
      key: string[];
    },
    cacheTtl = dayjs.duration(1, "week"),
  ): Promise<GeoDataService.LayerContents | null> {
    try {
      let url = `${URL}/v2/content/${layerRef}`;
      if (filter) {
        let queryParams = [];
        for (let [key, value] of Object.entries({
          relation: filter.relation,
          other_layer: filter.otherLayer,
          key: filter.key,
        }))
          queryParams.push(`${key}=${value}`);
        url += `/filtered?${queryParams.join("&")}`;
      }

      let context = new HttpContext()
        .set(httpContexts.validateSchema, LAYER_CONTENTS)
        .set(httpContexts.cache, [url, cacheTtl]);

      return await firstValueFrom(
        this.http.get<GeoDataService.LayerContents>(url, {context}),
      );
    } catch (error) {
      if (!(error instanceof HttpErrorResponse)) throw error;
      if (error.status === HttpStatusCode.NotFound) return null;
      throw error;
    }
  }

  identify(keys: string[]): Promise<GeoDataService.IdentifiedObjects> {
    let queryParams = keys.map(k => `key=${k}`);
    let url = `${URL}/v1/identify?${queryParams.join("=")}`;
    return firstValueFrom(
      this.http.get<GeoDataService.IdentifiedObjects>(url, {
        context: new HttpContext().set(
          httpContexts.validateSchema,
          IDENTIFIED_OBJECTS,
        ),
      }),
    );
  }
}

export namespace GeoDataService {
  export type LayerInformation = JTDDataType<typeof LAYER_INFORMATION>;
  export type AvailableLayers = JTDDataType<typeof AVAILABLE_LAYERS_SCHEMA>;
  export type LayerContent = Omit<
    JTDDataType<typeof LAYER_CONTENT>,
    "geometry"
  > & {geometry: GeoJSON};
  export type LayerContents = Omit<
    JTDDataType<typeof LAYER_CONTENTS>,
    "data"
  > & {data: LayerContent[]};
  export type IdentifiedObjects = JTDDataType<typeof IDENTIFIED_OBJECTS>;
}

const LAYER_INFORMATION = {
  properties: {
    id: {type: "string"},
    name: {type: "string"},
    key: {type: "string"},
  },
  optionalProperties: {
    description: {type: "string"},
    attribution: {type: "string"},
    attributionURL: {type: "string"},
    crs: {type: "uint32"},
    private: {type: "boolean"},
  },
} as const;

const AVAILABLE_LAYERS_SCHEMA = {
  elements: LAYER_INFORMATION,
} as const;

const LAYER_CONTENT = {
  properties: {
    name: {type: "string", nullable: true},
    id: {type: "uint32"},
    key: {type: "string"},
    geometry: {
      optionalProperties: {},
      additionalProperties: true,
    },
  },
  optionalProperties: {
    additionalProperties: {
      optionalProperties: {},
      additionalProperties: true,
    },
  },
} as const;

const LAYER_CONTENTS = {
  properties: {
    data: {elements: LAYER_CONTENT},
  },
  optionalProperties: {
    attribution: {type: "string", nullable: true},
    attributionURL: {type: "string", nullable: true},
  },
} as const;

const IDENTIFIED_OBJECTS = {
  values: {
    values: LAYER_CONTENT,
  },
} as const;
