import {
  computed,
  effect,
  signal,
  viewChild,
  Component,
  Signal,
} from "@angular/core";
import {toSignal} from "@angular/core/rxjs-interop";
import {ActivatedRoute, Router} from "@angular/router";
import {
  ControlComponent,
  LayerComponent,
  MapComponent,
  GeoJSONSourceComponent,
  NavigationControlDirective,
} from "@maplibre/ngx-maplibre-gl";
import {TranslateDirective} from "@ngx-translate/core";
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
    TranslateDirective,
  ],
  templateUrl: "./select-view.component.html",
})
export class SelectViewComponent {
  protected style = colorful as any as StyleSpecification;

  protected clusterHoverId = signal<undefined | number>(undefined);
  protected hoverId = signal<undefined | number>(undefined);
  protected fitBounds = signal<undefined | BBox>(undefined);
  protected waterRightsSource =
    viewChild.required<GeoJSONSourceComponent>("waterRightsSource");

  protected usageLocationSize: Signal<number | null | undefined>;
  protected usageLocationProgress: Signal<number>;
  protected usageLocations: Signal<
    undefined | FeatureCollection<Point, WaterRightsService.UsageLocations[0]>
  >;

  protected mapLoadStatus = signal<
    "receiving" | "downloading" | "rendering" | "done"
  >("receiving");
  protected mapLoadStatusIndex = computed(() => {
    // prettier-ignore
    switch (this.mapLoadStatus()) {
      case "receiving": return 1;
      case "downloading": return 2;
      case "rendering": return 3;
      case "done": return 4;
    }
  });

  protected hover = computed(() => {
    let locations = this.usageLocations();
    if (!locations) return;
    return locations.features.find(location => location.id == this.hoverId())
      ?.properties;
  });

  protected util = {log: console.log};

  constructor(
    private service: WaterRightsService,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    let fetchUsageLocation = this.service.fetchUsageLocations();
    this.usageLocationSize = signals.fromPromise(fetchUsageLocation.total);
    this.usageLocationProgress = toSignal(fetchUsageLocation.progress, {
      initialValue: 0,
    });
    this.usageLocations = signals.fromPromise(
      fetchUsageLocation.data,
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

    effect(() => {
      if (this.mapLoadStatus() != "receiving") return;
      if (this.usageLocationSize() === undefined) return;
      this.mapLoadStatus.set("downloading");
    });

    effect(() => {
      if (!this.usageLocations()) return;
      this.mapLoadStatus.set("rendering");
    });
  }

  protected onMapIdle() {
    if (this.mapLoadStatus() != "rendering") return;
    this.mapLoadStatus.set("done");
  }

  protected openDetails(no: number) {
    this.router.navigate(["details"], {
      relativeTo: this.route,
      queryParams: {no},
    });
  }
}
