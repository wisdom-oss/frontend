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
}

export namespace RrbDigitalTwinService {
    export type BasinFeatureCollection = {
        type: "FeatureCollection";
        bbox: [number, number, number, number];
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
}
