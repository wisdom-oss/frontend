import {
  httpResource,
  HttpClient,
  HttpStatusCode,
  HttpContext,
  HttpResourceRef,
  HttpErrorResponse,
} from "@angular/common/http";
import {Injectable, Signal} from "@angular/core";
import dayjs from "dayjs";
import {Geometry} from "geojson";
import {firstValueFrom} from "rxjs";
import typia from "typia";

import {httpContexts} from "../common/http-contexts";
import {s} from "../common/s.tag";
import { api } from "../common/api";

const URL = "/api/geodata" as const;

@Injectable({
  providedIn: "root",
})
export class GeoDataService {
  constructor(private http: HttpClient) {}

  fetchAvailableLayers(): api.Signal<GeoDataService.AvailableLayers> {
    return api.resource<GeoDataService.AvailableLayers>({url: `${URL}/v2/`});
  }

  fetchLayerInformation(
    layerRef: api.MaybeSignal<string>,
  ): api.Signal<GeoDataService.LayerInformation> {
    return api.resource<GeoDataService.LayerInformation>({
      url: s`${URL}/v1/${layerRef}`,
      // onError: {[HttpStatusCode.NotFound]: () => null},
    });
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
        .set(
          httpContexts.validateType,
          typia.createValidate<GeoDataService.LayerContents>(),
        )
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

  identify(keys: Iterable<string>): Promise<GeoDataService.IdentifiedObjects> {
    let queryParams: string[] = [];
    for (let key of keys) queryParams.push(`key=${key}`);
    let url = `${URL}/v1/identify?${queryParams.join("&")}`;
    return firstValueFrom(
      this.http.get<GeoDataService.IdentifiedObjects>(url, {
        context: new HttpContext().set(
          httpContexts.validateType,
          typia.createValidate<GeoDataService.IdentifiedObjects>(),
        ),
      }),
    );
  }
}

export namespace GeoDataService {
  export type LayerInformation = {
    id: string;
    name: string;
    key: string;
    description?: string;
    attribution?: string;
    attributionURL?: string | null;
    crs?: number & typia.tags.Type<"uint32">;
    private?: boolean;
  };

  export type AvailableLayers = LayerInformation[];

  export type LayerContent = {
    name: string | null;
    id: number & typia.tags.Type<"uint32">;
    key: string;
    geometry: Geometry;
    additionalProperties: Record<string, any> | null;
  };

  export type LayerContents = {
    data: LayerContent[];
    attribution?: string | null;
    attributionURL?: string | null;
  };

  export type IdentifiedObjects = Record<string, Record<string, LayerContent>>;
}
