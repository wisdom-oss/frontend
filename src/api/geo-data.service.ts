import {
  httpResource,
  HttpClient,
  HttpStatusCode,
  HttpContext,
  HttpResourceRef,
  HttpErrorResponse,
} from "@angular/common/http";
import {computed, inject, Injectable, Signal} from "@angular/core";
import dayjs from "dayjs";
import {Geometry} from "geojson";
import {firstValueFrom} from "rxjs";
import typia from "typia";

import {httpContexts} from "../common/http-contexts";
import {s} from "../common/s.tag";
import {api} from "../common/api";
import {signals} from "../common/signals";

const URL = "/api/geodata" as const;

@Injectable({
  providedIn: "root",
})
export class GeoDataService {
  private http = inject(HttpClient);

  fetchAvailableLayers(): api.Signal<GeoDataService.AvailableLayers> {
    return api.resource({
      url: `${URL}/v2/`,
      validate: typia.createValidate<GeoDataService.AvailableLayers>(),
    });
  }

  fetchLayerInformation(
    layerRef: api.RequestSignal<string>,
  ): api.Signal<GeoDataService.LayerInformation | null> {
    return api.resource({
      url: api.url`${URL}/v1/${layerRef}`,
      validate: typia.createValidate<GeoDataService.LayerInformation>(),
      onError: {[HttpStatusCode.NotFound]: () => null},
    });
  }

  fetchLayerContents(
    layerRef: api.RequestSignal<string>,
    filter?: api.RequestSignal<{
      relation: "within" | "overlaps" | "contains";
      otherLayer: string;
      key: string[];
    }>,
    cacheTtl = dayjs.duration(1, "week"),
  ): api.Signal<GeoDataService.LayerContents | null, null> {
    let filterParam = computed(() => {
      let filterOptions = api.toSignal(filter)();
      if (!filterOptions) return "";
      let {relation, otherLayer, key} = filterOptions;
      return `/filtered?relation=${relation}&other_layer=${otherLayer}&key=${key}`;
    });

    return api.resource({
      url: api.url`${URL}/v2/content/${layerRef}${filterParam}`,
      validate: typia.createValidate<GeoDataService.LayerContents>(),
      cache: cacheTtl,
      defaultValue: null,
      onError: {[HttpStatusCode.NotFound]: () => null},
    });
  }

  identify(
    keys: api.RequestSignal<Iterable<string>>,
  ): api.Signal<GeoDataService.IdentifiedObjects> {
    let url = computed(() => {
      let queryParams = [];
      let iter = api.toSignal(keys)();
      if (iter === undefined) return undefined;
      for (let key of iter) queryParams.push(`key=${key}`);
      return `${URL}/v1/identify?${queryParams.join("&")}`;
    });

    return api.resource({
      url,
      validate: typia.createValidate<GeoDataService.IdentifiedObjects>(),
    });
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
