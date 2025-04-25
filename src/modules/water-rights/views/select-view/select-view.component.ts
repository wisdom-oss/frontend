import {computed, signal, Component, Signal} from "@angular/core";
import {ActivatedRoute, Router} from "@angular/router";
import {
  ControlComponent,
  LayerComponent,
  MapComponent,
  GeoJSONSourceComponent,
  NavigationControlDirective,
} from "@maplibre/ngx-maplibre-gl";
import {BBox, FeatureCollection, Point} from "geojson";
import {StyleSpecification} from "maplibre-gl";

import {WaterRightsService} from "../../../../api/water-rights.service";
import colorful from "../../../../assets/map/styles/colorful.json";
import {signals} from "../../../../common/signals";
import {ResizeMapOnLoadDirective} from "../../../../common/directives/resize-map-on-load.directive";
import {ClusterPolygonSourceDirective} from "../../../../common/directives/cluster-polygon-source.directive";
import {MapCursorDirective} from "../../../../common/directives/map-cursor.directive";

@Component({
  imports: [
    ControlComponent,
    GeoJSONSourceComponent,
    MapComponent,
    NavigationControlDirective,
    ResizeMapOnLoadDirective,
    LayerComponent,
    ClusterPolygonSourceDirective,
    MapCursorDirective,
  ],
  templateUrl: "./select-view.component.html",
})
export class SelectViewComponent {
  protected style = colorful as any as StyleSpecification;

  protected clusterHoverId = signal<undefined | number>(undefined);
  protected hoverId = signal<undefined | number>(undefined);
  protected fitBounds = signal<undefined | BBox>(undefined);

  protected usageLocations: Signal<
    | undefined
    | FeatureCollection<Point, WaterRightsServiceService.UsageLocations[0]>
  >;

  protected hover = computed(() => {
    let locations = this.usageLocations();
    if (!locations) return;
    return locations.features.find(location => location.id == this.hoverId())
      ?.properties;
  });

  constructor(
    private service: WaterRightsService,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    this.usageLocations = signals.fromPromise(
      this.service.fetchUsageLocations(),
      locations => ({
        type: "FeatureCollection",
        features: locations
          .filter(location => !!location.location)
          .map(location => ({
            type: "Feature",
            id: location.id,
            geometry: location.location!,
            properties: location,
          })),
      }),
    );
  }

  protected openDetails(no: number) {
    this.router.navigate(["details"], {
      relativeTo: this.route,
      queryParams: {no},
    });
  }
}
