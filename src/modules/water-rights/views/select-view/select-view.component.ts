import {computed, effect, signal, Component, Signal} from "@angular/core";
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

import {GeoDataService} from "../../../../api/geo-data.service";
import colorful from "../../../../assets/map/styles/colorful.json";
import {signals} from "../../../../common/signals";
import {LayerSelectionControlComponent} from "../../../../common/components/map/layer-selection-control/layer-selection-control.component";
import {ResizeMapOnLoadDirective} from "../../../../common/directives/resize-map-on-load.directive";
import {ClusterPolygonSourceDirective} from "../../../../common/directives/cluster-polygon-source.directive";
import {MapCursorDirective} from "../../../../common/directives/map-cursor.directive";

type LegalDepartment = "A" | "B" | "C" | "D" | "E" | "F" | "K" | "L";

@Component({
  imports: [
    ClusterPolygonSourceDirective,
    ControlComponent,
    GeoJSONSourceComponent,
    LayerComponent,
    LayerSelectionControlComponent,
    MapComponent,
    MapCursorDirective,
    NavigationControlDirective,
    ResizeMapOnLoadDirective,
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
    | FeatureCollection<
        Point,
        {
          id: number;
          name: string;
          legalDepartment: LegalDepartment;
          waterRight: number;
        }
      >
  >;

  protected selectLegalDepartments: Record<
    LegalDepartment,
    signals.ToggleableSignal
  > = {
    A: signals.toggleable(false),
    B: signals.toggleable(false),
    C: signals.toggleable(false),
    D: signals.toggleable(false),
    E: signals.toggleable(true),
    F: signals.toggleable(false),
    K: signals.toggleable(false),
    L: signals.toggleable(false),
  };

  protected filteredUsageLocations: SelectViewComponent["usageLocations"] =
    computed(() => {
      let usageLocations = this.usageLocations();
      if (!usageLocations) return undefined;
      return {
        type: "FeatureCollection",
        features: usageLocations.features.filter(
          ({properties: {legalDepartment}}) =>
            this.selectLegalDepartments[legalDepartment](),
        ),
      };
    });

  protected hover = computed(() => {
    let locations = this.usageLocations();
    if (!locations) return;
    return locations.features.find(location => location.id == this.hoverId())
      ?.properties;
  });

  protected util = {log: console.log};

  constructor(
    geo: GeoDataService,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    this.usageLocations = signals.fromPromise(
      geo.fetchLayerContents("water_right_usage_locations"),
      locations => ({
        type: "FeatureCollection",
        features: (locations?.data ?? []).map(location => ({
          type: "Feature",
          id: location.id,
          geometry: location.geometry as Point,
          properties: {
            id: location.id,
            name: location.name as string,
            legalDepartment: location.additionalProperties![
              "legalDepartment"
            ]! as LegalDepartment,
            waterRight: location.additionalProperties!["waterRight"]! as number,
          },
        })),
      }),
    );

    effect(() => console.log(this.hover()));

    geo
      .fetchLayerContents("water_right_usage_locations")
      .then(data => console.log(data));
  }

  protected openDetails(no: number) {
    this.router.navigate(["details"], {
      relativeTo: this.route,
      queryParams: {no},
    });
  }
}
