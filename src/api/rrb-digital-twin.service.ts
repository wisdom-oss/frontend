import {Injectable} from "@angular/core";

import {api} from "../common/api";
import typia from "typia";
import {Geometry} from "geojson";

const URL = "/api/rrb-digital-twin" as const;

@Injectable({
    providedIn: "root"
})
export class RrbDigitalTwinService extends api.service(URL) {
    fetchGetBasins(): api.Signal<RrbDigitalTwinService.BasinFeatureCollection> {
        return api.resource({
            url: `${URL}/v1/get-basins`,
            validate: typia.createValidate<RrbDigitalTwinService.BasinFeatureCollection>()
        });
    }

    fetchGetCatchmentAreasOfBasin(basinId: api.RequestSignal<string>): api.Signal<RrbDigitalTwinService.CatchmentAreaFeatureCollection> {
        return api.resource({
            url: `${URL}/v1/get-catchment-areas-of-basin?basin_id=${basinId}`,
            validate: typia.createValidate<RrbDigitalTwinService.CatchmentAreaFeatureCollection>()
        });
    }
}

export namespace RrbDigitalTwinService {
    export type BasinFeatureCollection = {
        type: "FeatureCollection";
        features: BasinFeature[];
    };

    export type BasinFeature = {
        type: "Feature";
        id: string;
        geometry: Geometry;
        properties: {
            city: string;
            maxSurfaceArea: number;
            maxVolume: number;
            name: string;
            soleArea: number;
        };
    };

    export type CatchmentAreaFeatureCollection = {
        type: "FeatureCollection";
        features: CatchmentAreaFeature[];
    }

    export type CatchmentAreaFeature = {
        type: "Feature";
        id: string;
        geometry: Geometry;
        properties: {
            basinId: number;
            name: string;
            area: number;
            pavedArea: number;
            unpavedArea: number;
        };
    }
}
