import { inject, Injectable } from "@angular/core";
import { RrbDigitalTwinService } from "../../../api/rrb-digital-twin.service";
import { signals } from "../../../common/signals";
import dayjs from "dayjs";

@Injectable({
    providedIn: "root",
})
export class RainRetentionBasinService {
    private rrb = inject(RrbDigitalTwinService);

    readonly basins = this.rrb.fetchGetBasins();

    getBasinById(currentId: string) {
        return this.basins()?.features.find(basin => basin.id === currentId);
    };

    getCatchmentAreas(basinId: string) {
        return signals.mapTo(this.rrb.fetchGetCatchmentAreasOfBasin(basinId), 
            (catchmentAreas): RrbDigitalTwinService.CatchmentAreaFeatureCollection => ({
                type: "FeatureCollection",
                features: (catchmentAreas?.features ?? [])
                .map(feature => ({
                    type: "Feature",
                    id: feature?.id ?? "",
                    geometry: feature?.geometry ?? {type: "GeometryCollection", coordinates: []},
                    properties: feature?.properties ?? {basinId: 0, name: "", area: 0, pavedArea: 0, unpavedArea: 0},
                })),
            }),
        );
    };

    getThrottles(basinId: string) {
        return signals.mapTo(this.rrb.fetchGetThrottlesOfBasin(basinId), 
            (throttles): RrbDigitalTwinService.ThrottleFeatureCollection => ({
                type: "FeatureCollection",
                features: (throttles?.features ?? [])
                .map(feature => ({
                    type: "Feature",
                    id: feature?.id ?? "",
                    geometry: feature?.geometry ?? {type: "MultiLineString", coordinates: []},
                    properties: feature?.properties ?? {basinId: 0, name: "", pipeDiameter: 0, pipeHeightBasin: 0, pipeHeightOutlet: 0, pipeLength: 0, localLossFactor: 0, roughness: 0},
                })),
            }),
        );
    };

    getWaterLevelSensor(basinId: string) {
        return signals.mapTo(this.rrb.fetchWaterLevelSensorOfBasin(basinId), 
            (sensor): RrbDigitalTwinService.WaterLevelSensorFeature => ({
                type: "Feature",
                id: sensor?.id ?? "",
                geometry: sensor?.geometry ?? {type: "Point", coordinates: []},
                properties: sensor?.properties ?? {basinId: 0, name: "", type: "", unit: ""},
            }),
        );
    };

    getLatestWaterLevel(sensorId: string) {
        return signals.mapTo(this.rrb.fetchLatestWaterLevel(sensorId),
            (waterLevel): RrbDigitalTwinService.WaterLevel => ({
                waterLevelSensorId: waterLevel?.waterLevelSensorId ?? 0,
                timestamp: waterLevel?.timestamp ?? dayjs(),
                level: waterLevel?.level ?? 0,
                volume: waterLevel?.volume ?? 0
            }),
        );
    };

    getNearestRainStation(basinId: string) {
        return signals.mapTo(this.rrb.fetchNearestRainStationOfBasin(basinId), 
            (station): RrbDigitalTwinService.RainStationFeature => ({
                type: "Feature",
                id: station?.id ?? "",
                geometry: station?.geometry ?? {type: "Point", coordinates: []},
                properties: station?.properties ?? {name: "", type: "", unit: "", city: ""},
            }),
        );
    };

    getLatestRain(stationId: string) {
        return signals.mapTo(this.rrb.fetchLatestRain(stationId),
            (rain): RrbDigitalTwinService.Rain => ({
                rainStationId: rain?.rainStationId ?? 0,
                timestamp: rain?.timestamp ?? dayjs(),
                value: rain?.value ?? 0
            }),
        );
    };
}