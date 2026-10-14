import { computed, Injectable, Signal } from "@angular/core";
import { RrbDigitalTwinService } from "../../../api/rrb-digital-twin.service";
import { signals } from "../../../common/signals";

@Injectable({
    providedIn: "root",
})
export class RainRetentionBasinService {
    readonly data = {
        basins: computed(() => this.rrb.basins()) as Signal<RrbDigitalTwinService.BasinFeatureCollection>,
    };

    private rrb: {
        service: RrbDigitalTwinService;
        basins: Signal<RrbDigitalTwinService.BasinFeatureCollection>,
    }

    constructor(rrb: RrbDigitalTwinService) {
        this.rrb = RainRetentionBasinService.constructRrbDataSignals(rrb);
    }

    private static constructRrbDataSignals(
        service: RrbDigitalTwinService,
    ) : RainRetentionBasinService["rrb"] {
        return {
            service,
            basins: signals.mapTo(
                service.fetchGetBasins(),
                (basins): RrbDigitalTwinService.BasinFeatureCollection => ({
                    type: "FeatureCollection",
                    bbox: basins?.bbox ?? [0, 0, 0, 0],
                    features: (basins?.features ?? [])
                    .map(feature => ({
                        type: "Feature",
                        id: feature?.id ?? "",
                        geometry: feature?.geometry ?? {type: "Point", coordinates: [0, 0]},
                        properties: feature?.properties ?? {city: "", maxSurfaceArea: 0, maxVolume: 0, name: "", soleArea: 0},
                   })),
               }),
            ),
        };
    }
}