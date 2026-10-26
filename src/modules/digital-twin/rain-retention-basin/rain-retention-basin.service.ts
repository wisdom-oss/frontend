import { inject, Injectable } from "@angular/core";
import { RrbDigitalTwinService } from "../../../api/rrb-digital-twin.service";
import { signals } from "../../../common/signals";

@Injectable({
    providedIn: "root",
})
export class RainRetentionBasinService {
    private rrb = inject(RrbDigitalTwinService);

    readonly basins = this.rrb.fetchGetBasins();

    getBasinById(currentId: string) {
        return this.basins()?.features.find(basin => basin.id === currentId);
    }

    getCatchmentAreas(basinId: string) {
        return signals.mapTo(this.rrb.fetchGetCatchmentAreasOfBasin(basinId), 
            (catchmentAreas): RrbDigitalTwinService.CatchmentAreaFeatureCollection => ({
                type: "FeatureCollection",
                features: (catchmentAreas?.features ?? [])
                .map(feature => ({
                    type: "Feature",
                    id: feature?.id ?? "",
                    geometry: feature?.geometry ?? {type: "GeometryCollection", coordinates: []},
                    properties: feature?.properties ?? {basinId: "", name: "", area: 0, pavedArea: 0, unpavedArea: 0},
                })),
            }),
        );
    }
}