import {computed, signal, Component, Signal} from "@angular/core";
import {ActivatedRoute, Router} from "@angular/router";
import {
  ControlComponent,
  LayerComponent,
  MapComponent,
  GeoJSONSourceComponent,
  AttributionControlDirective,
  NavigationControlDirective,
} from "@maplibre/ngx-maplibre-gl";
import dayjs from "dayjs";
import {BBox, FeatureCollection, Point} from "geojson";
import {StyleSpecification} from "maplibre-gl";

import {GeoDataService} from "../../../../api/geo-data.service";
import {WaterRightsService} from "../../../../api/water-rights.service";
import colorful from "../../../../assets/map/styles/colorful.json";
import {signals} from "../../../../common/signals";
import {LayerSelectionControlComponent} from "../../../../common/components/map/layer-selection-control/layer-selection-control.component";
import {ResizeMapOnLoadDirective} from "../../../../common/directives/resize-map-on-load.directive";
import {ClusterPolygonSourceDirective} from "../../../../common/directives/cluster-polygon-source.directive";
import {MapCursorDirective} from "../../../../common/directives/map-cursor.directive";
import {RecreateOnDirective} from "../../../../common/directives/recreate-on.directive";

type LegalDepartment = WaterRightsService.UsageLocation["legalDepartment"];

@Component({
  imports: [
    AttributionControlDirective,
    ClusterPolygonSourceDirective,
    ControlComponent,
    GeoJSONSourceComponent,
    LayerComponent,
    LayerSelectionControlComponent,
    MapComponent,
    MapCursorDirective,
    NavigationControlDirective,
    RecreateOnDirective,
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
    | {
        attribution?: string;
        attributionURL?: string;
        data: FeatureCollection<
          Point,
          {
            id: number;
            name: string;
            legalDepartment: LegalDepartment;
            waterRight: number;
          }
        >;
      }
  >;

  protected attribution = computed(() => {
    let usageLocations = this.usageLocations();
    if (!usageLocations) return;
    let {attribution, attributionURL} = usageLocations;
    if (!attributionURL) return attribution;
    return `<a href="${attributionURL}" target="_blank">${attribution}</a>`;
  });

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
        data: {
          type: "FeatureCollection",
          features: usageLocations.data.features.filter(
            ({properties: {legalDepartment}}) =>
              this.selectLegalDepartments[legalDepartment](),
          ),
        },
      };
    });

  protected hover = computed(() => {
    let locations = this.usageLocations();
    if (!locations) return;
    return locations.data.features.find(
      location => location.id == this.hoverId(),
    )?.properties;
  });

  protected util = {log: console.log};

  constructor(
    geo: GeoDataService,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    this.usageLocations = signals.mapTo(
      geo.fetchLayerContents(
        "water_right_usage_locations",
        undefined,
        dayjs.duration(1, "day"),
      ),
      locations => ({
        attribution: locations?.attribution ?? undefined,
        attributionURL: locations?.attributionURL ?? undefined,
        data: {
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
              waterRight: location.additionalProperties![
                "waterRight"
              ]! as number,
            },
          })),
        },
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
