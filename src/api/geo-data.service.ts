import {
  HttpClient,
  HttpStatusCode,
  HttpContext,
  HttpErrorResponse,
} from "@angular/common/http";
import {Injectable} from "@angular/core";
import {JTDDataType} from "ajv/dist/core";
import {GeoJSON} from "geojson";
import {catchError, firstValueFrom} from "rxjs";

import {httpContexts} from "../common/http-contexts";

const URL = "/api/geodata";

@Injectable({
  providedIn: "root",
})
export class GeoDataService {
  constructor(private http: HttpClient) {}

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

  async fetchLayerContents(
    layerRef: string,
  ): Promise<GeoDataService.LayerContents | null> {
    try {
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
}

export namespace GeoDataService {
  export type LayerInformation = JTDDataType<typeof LAYER_INFORMATION>;
  export type AvailableLayers = JTDDataType<typeof AVAILABLE_LAYERS_SCHEMA>;
  export type LayerContents = (Omit<
    JTDDataType<typeof LAYER_CONTENTS>[0],
    "geometry"
  > & {geometry: GeoJSON})[];
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

const LAYER_CONTENTS = {
  elements: {
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
  },
} as const;
