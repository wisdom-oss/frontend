import {
  httpResource,
  HttpClient,
  HttpStatusCode,
  HttpContext,
  HttpResourceRef,
  HttpErrorResponse,
} from "@angular/common/http";
import {computed, Injectable, Signal} from "@angular/core";
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
    return api.resource({
      url: `${URL}/v2/`,
      validate: typia.createValidate<GeoDataService.AvailableLayers>()
    });
  }

  fetchLayerInformation(
    layerRef: api.MaybeSignal<string>,
  ): api.Signal<GeoDataService.LayerInformation | null> {
    return api.resource({
      url: s`${URL}/v1/${layerRef}`,
      validate: typia.createValidate<GeoDataService.LayerInformation>(),
      onError: {[HttpStatusCode.NotFound]: () => null},
    });
  }

  fetchLayerContents(
    layerRef: api.MaybeSignal<string>,
    filter?: api.MaybeSignal<{
      relation: "within" | "overlaps" | "contains",
      otherLayer: string,
      key: string[],
    }>,
    cacheTtl = dayjs.duration(1, "week")
  ): api.Signal<GeoDataService.LayerContents | null, null> {
    let url = computed(() => {
      let url = `${URL}/v2/content/${api.maybe(layerRef)()}`;
      if (filter) {
        let {relation, otherLayer, key} = api.maybe(filter)();
        url += `/filtered?relation=${relation}&other_layer=${otherLayer}&key=${key}`;
      }

      return url;
    });

    return api.resource({
      url, 
      validate: typia.createValidate<GeoDataService.LayerContents>(),
      cache: cacheTtl,
      defaultValue: null,
      onError: {[HttpStatusCode.NotFound]: () => null}
    })
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
