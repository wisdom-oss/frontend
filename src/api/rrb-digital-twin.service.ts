import {Injectable} from "@angular/core";

import {api} from "../common/api";
import typia from "typia";
import {Geometry} from "geojson";
import dayjs, { Dayjs } from "dayjs";

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
    };

    fetchGetCatchmentAreasOfBasin(basinId: api.RequestSignal<string>): api.Signal<RrbDigitalTwinService.CatchmentAreaFeatureCollection> {
        return api.resource({
            url: `${URL}/v1/get-catchment-areas-of-basin?id=${basinId}`,
            validate: typia.createValidate<RrbDigitalTwinService.CatchmentAreaFeatureCollection>()
        });
    };

    fetchGetThrottlesOfBasin(basinId: api.RequestSignal<string>): api.Signal<RrbDigitalTwinService.ThrottleFeatureCollection> {
        return api.resource({
            url: `${URL}/v1/get-throttles-of-basin?id=${basinId}`,
            validate: typia.createValidate<RrbDigitalTwinService.ThrottleFeatureCollection>()
        });
    };

    fetchWaterLevelSensorOfBasin(basinId: api.RequestSignal<string>): api.Signal<RrbDigitalTwinService.WaterLevelSensorFeature> {
        return api.resource({
            url: `${URL}/v1/get-water-level-sensor-of-basin?id=${basinId}`,
            validate: typia.createValidate<RrbDigitalTwinService.WaterLevelSensorFeature>()
        });
    };

    fetchLatestWaterLevel(sensorId: api.RequestSignal<string>): api.Signal<RrbDigitalTwinService.WaterLevel> {
        let parse = (waterLevel: RrbDigitalTwinService.WaterLevel): RrbDigitalTwinService.WaterLevel  => {
              waterLevel.timestamp = dayjs(waterLevel.timestamp);
              return waterLevel;
            }; 

        return api.resource({
            url: `${URL}/v1/get-latest-water-level-of-sensor?id=${sensorId}`,
            parse,
            validate: typia.createValidate<RrbDigitalTwinService.WaterLevel>()
        });
    };

    fetchNearestRainStationOfBasin(basinId: api.RequestSignal<string>): api.Signal<RrbDigitalTwinService.RainStationFeature> {
        return api.resource({
            url: `${URL}/v1/get-nearest-rain-station-of-basin?id=${basinId}`,
            validate: typia.createValidate<RrbDigitalTwinService.RainStationFeature>()
        });
    };

    fetchLatestRain(stationId: api.RequestSignal<string>): api.Signal<RrbDigitalTwinService.Rain> {
        let parse = (rain: RrbDigitalTwinService.Rain): RrbDigitalTwinService.Rain  => {
              rain.timestamp = dayjs(rain.timestamp);
              return rain;
            }; 

        return api.resource({
            url: `${URL}/v1/get-latest-rain-of-rain-station?id=${stationId}`,
            parse,
            validate: typia.createValidate<RrbDigitalTwinService.Rain>()
        });
    };
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
    };

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
    };

    export type ThrottleFeatureCollection = {
        type: "FeatureCollection";
        features: ThrottleFeature[];
    };

    export type ThrottleFeature = {
        type: "Feature";
        id: string;
        geometry: Geometry;
        properties: {
            basinId: number;
            name: string;
            pipeDiameter: number;
            pipeHeightBasin: number;
            pipeHeightOutlet: number;
            pipeLength: number;
            localLossFactor: number;
            roughness: number;
        };
    };

    export type WaterLevelSensorFeature = {
        type: "Feature";
        id: string;
        geometry: Geometry;
        properties: {
            basinId: number;
            name: string;
            type: string;
            unit: string;
        };
    };

    export type WaterLevel = {
        waterLevelSensorId: number;
        timestamp: Dayjs;
        level: number;
        volume: number;
    };

    export type RainStationFeature = {
        type: "Feature";
        id: string;
        geometry: Geometry;
        properties: {
            name: string;
            type: string;
            unit: string;
            city: string;
        };
    };

    export type Rain = {
        rainStationId: number;
        timestamp: Dayjs;
        value: number;
    };
}
