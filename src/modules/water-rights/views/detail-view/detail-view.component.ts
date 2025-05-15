import {NgIf} from "@angular/common";
import {computed, effect, Component, Signal} from "@angular/core";
import {ActivatedRoute} from "@angular/router";
import {
  ControlComponent,
  LayerComponent,
  MapComponent,
  GeoJSONSourceComponent,
  NavigationControlDirective,
} from "@maplibre/ngx-maplibre-gl";
import {provideIcons, NgIconComponent} from "@ng-icons/core";
import {
  remixArticleLine,
  remixCheckboxCircleLine,
  remixCloseCircleLine,
  remixHistoryFill,
  remixQuillPenLine,
  remixTimeLine,
} from "@ng-icons/remixicon";
import {TranslateDirective, TranslatePipe} from "@ngx-translate/core";
import dayjs from "dayjs";
import {BBox, FeatureCollection, Point} from "geojson";
import {StyleSpecification} from "maplibre-gl";

import * as turf from "@turf/turf";

import {WaterRightsService} from "../../../../api/water-rights.service";
import {GeoDataService} from "../../../../api/geo-data.service";
import colorful from "../../../../assets/map/styles/colorful.json";
import {signals} from "../../../../common/signals";

type UsageLocations = FeatureCollection<
  Point,
  {id: number; name: string; waterRight: number}
>;

@Component({
  imports: [
    ControlComponent,
    GeoJSONSourceComponent,
    LayerComponent,
    MapComponent,
    NavigationControlDirective,
    NgIconComponent,
    TranslateDirective,
    TranslatePipe,
    NgIf,
  ],
  templateUrl: "./detail-view.component.html",
  providers: [
    provideIcons({
      remixCheckboxCircleLine,
      remixCloseCircleLine,
      remixArticleLine,
      remixHistoryFill,
      remixQuillPenLine,
      remixTimeLine,
    }),
  ],
})
export class DetailViewComponent {
  protected data: Signal<undefined | WaterRightsService.WaterRightDetails>;

  // prettier-ignore
  protected mapData: {
    style: StyleSpecification;
    usageLocations: ReturnType<typeof DetailViewComponent["buildUsageLocations"]>;
    fitBounds: Signal<undefined | BBox>,
  };

  constructor(
    route: ActivatedRoute,
    service: WaterRightsService,
    geo: GeoDataService,
  ) {
    this.data = signals.fromPromise(
      service.fetchWaterRightDetails(+route.snapshot.queryParams["no"]!),
    );

    let usageLocations = DetailViewComponent.buildUsageLocations(
      geo,
      this.data,
    );

    let fitBounds = DetailViewComponent.buildFitBounds(usageLocations);

    this.mapData = {
      style: colorful as any as StyleSpecification,
      usageLocations,
      fitBounds,
    };

    effect(() => console.log(this.data()));
  }

  private static buildUsageLocations(
    geo: GeoDataService,
    dataSignal: DetailViewComponent["data"],
  ): Signal<undefined | UsageLocations> {
    let allUsageLocations = signals.fromPromise(
      geo.fetchLayerContents(
        "water_right_usage_locations",
        undefined,
        dayjs.duration(1, "day"),
      ),
      locations => ({
        type: "FeatureCollection",
        features: (locations?.data ?? []).map(location => ({
          type: "Feature" as const,
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

    return computed(() => {
      let data = dataSignal();
      let usageLocations = allUsageLocations();
      if (!data || !usageLocations) return undefined;

      let usageLocationIds = data.usageLocations.map(({id}) => id);

      return {
        type: "FeatureCollection",
        features: usageLocations.features.filter(({properties: {id}}) =>
          usageLocationIds.includes(id),
        ),
      };
    });
  }

  private static buildFitBounds(
    usageLocationsSignal: Signal<undefined | UsageLocations>,
  ): Signal<undefined | BBox> {
    return computed(() => {
      let usageLocations = usageLocationsSignal();
      if (!usageLocations) return undefined;

      let bbox = turf.bbox(usageLocations);
      let [minX, minY, maxX, maxY] = bbox;
      let padding = 0.002;
      let paddedBbox = [
        minX - padding,
        minY - padding,
        maxX + padding,
        maxY + padding,
      ];
      return paddedBbox as BBox;
    });
  }
}
