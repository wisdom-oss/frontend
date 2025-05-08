import {NgIf} from "@angular/common";
import {computed, effect, signal, Component, Signal} from "@angular/core";
import {ActivatedRoute} from "@angular/router";
import {
  LayerComponent,
  MapComponent,
  GeoJSONSourceComponent,
} from "@maplibre/ngx-maplibre-gl";
import {TranslatePipe} from "@ngx-translate/core";
import dayjs from "dayjs";
import {FeatureCollection, Point} from "geojson";
import {StyleSpecification} from "maplibre-gl";

import {WaterRightsService} from "../../../../api/water-rights.service";
import {GeoDataService} from "../../../../api/geo-data.service";
import colorful from "../../../../assets/map/styles/colorful.json";
import {signals} from "../../../../common/signals";

@Component({
  imports: [MapComponent, GeoJSONSourceComponent, LayerComponent],
  templateUrl: "./detail-view.component.html",
})
export class DetailViewComponent {
  protected data: Signal<undefined | WaterRightsService.WaterRightDetails>;
  private allUsageLocations: Signal<
    | undefined
    | FeatureCollection<Point, {id: number; name: string; waterRight: number}>
  >;
  protected usageLocationPoints: DetailViewComponent["allUsageLocations"] =
    computed(() => {
      let data = this.data();
      let allUsageLocations = this.allUsageLocations();
      if (!data || !allUsageLocations) return undefined;

      let usageLocationIds = data.usageLocations.map(({id}) => id);

      return {
        type: "FeatureCollection",
        features: allUsageLocations.features.filter(({properties: {id}}) =>
          usageLocationIds.includes(id),
        ),
      };
    });

  protected style = colorful as any as StyleSpecification;

  constructor(
    route: ActivatedRoute,
    service: WaterRightsService,
    geo: GeoDataService,
  ) {
    this.data = signals.fromPromise(
      service.fetchWaterRightDetails(+route.snapshot.queryParams["no"]!),
    );

    this.allUsageLocations = signals.fromPromise(
      geo.fetchLayerContents(
        "water_right_usage_locations",
        undefined,
        dayjs.duration(1, "day"),
      ),
      locations => ({
        type: "FeatureCollection",
        features: (locations?.data ?? []).map(location => ({
          type: "Feature",
          id: location.id,
          geometry: location.geometry as Point,
          properties: {
            id: location.id,
            name: location.name as string,
            waterRight: location.additionalProperties!["waterRight"]! as number,
          },
        })),
      }),
    );

    effect(() => console.log(this.data()));
    effect(() => console.log(this.usageLocationPoints()));
  }
}
