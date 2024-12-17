import {
  HttpClient,
  HttpStatusCode,
  HttpContext,
  HttpErrorResponse,
} from "@angular/common/http";
import {Injectable} from "@angular/core";
import {JTDDataType} from "ajv/dist/core";
import {GeoJSON} from "geojson";
import {firstValueFrom} from "rxjs";

import {httpContexts} from "../common/http-contexts";
import {typeUtils} from "../common/type-utils";

const URL = "/api/geodata";

@Injectable({
  providedIn: "root",
})
export class GeoDataService {
  constructor(private http: HttpClient) {}

  fetchAvailableLayers(): Promise<GeoDataService.AvailableLayers> {
    return firstValueFrom(
      this.http.get<GeoDataService.AvailableLayers>(`${URL}/`, {
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
        this.http.get<GeoDataService.LayerInformation>(`${URL}/${layerRef}`, {
          context: new HttpContext().set(
            httpContexts.validateSchema,
            LAYER_INFORMATION,
          ),
        }),
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
  ): Promise<GeoDataService.LayerContents | null> {
    try {
      if (filter) {
        let queryParams = [];
        for (let [key, value] of Object.entries({
          relation: filter.relation,
          other_layer: filter.otherLayer,
          key: filter.key,
        }))
          queryParams.push(`${key}=${value}`);

        let url = `${URL}/content/${layerRef}/filtered?${queryParams.join("&")}`;
        return await firstValueFrom(
          this.http.get<GeoDataService.LayerContents>(url, {
            context: new HttpContext().set(
              httpContexts.validateSchema,
              LAYER_CONTENTS,
            ),
          }),
        );
      }

      return await firstValueFrom(
        this.http.get<GeoDataService.LayerContents>(
          `${URL}/content/${layerRef}`,
          {
            context: new HttpContext().set(
              httpContexts.validateSchema,
              LAYER_CONTENTS,
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

  identify(keys: string[]): Promise<GeoDataService.IdentifiedObjects> {
    let queryParams = keys.map(k => `key=${k}`);
    let url = `${URL}/identify?${queryParams.join("=")}`;
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
  export type LayerContents = typeUtils.UpdateElements<
    JTDDataType<typeof LAYER_CONTENTS>,
    "geometry",
    {geometry: GeoJSON}
  >;
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
    crs: {type: "uint32"},
  },
} as const;

const AVAILABLE_LAYERS_SCHEMA = {
  elements: LAYER_INFORMATION,
} as const;

const LAYER_CONTENT = {
  optionalProperties: {
    id: {type: "uint32"},
    name: {type: "string"},
    key: {type: "string"},
    additionalProperties: {
      optionalProperties: {},
      additionalProperties: true,
    },
    geometry: {
      optionalProperties: {},
      additionalProperties: true,
    },
  },
} as const;

const LAYER_CONTENTS = {
  elements: LAYER_CONTENT,
} as const;

const IDENTIFIED_OBJECTS = {
  values: {
    values: LAYER_CONTENT,
  },
} as const;
