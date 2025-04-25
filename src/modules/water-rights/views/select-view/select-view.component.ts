import {effect, Component, Signal} from "@angular/core";
import {
  ControlComponent,
  LayerComponent,
  MapComponent,
  GeoJSONSourceComponent,
  NavigationControlDirective,
} from "@maplibre/ngx-maplibre-gl";
import {FeatureCollection, Point} from "geojson";
import {StyleSpecification} from "maplibre-gl";

import {WaterRightsServiceService} from "../../../../api/water-rights-service.service";
import colorful from "../../../../assets/map/styles/colorful.json";
import {signals} from "../../../../common/signals";
import {ResizeMapOnLoadDirective} from "../../../../common/directives/resize-map-on-load.directive";

@Component({
  imports: [
    ControlComponent,
    GeoJSONSourceComponent,
    MapComponent,
    NavigationControlDirective,
    ResizeMapOnLoadDirective,
    LayerComponent,
  ],
  templateUrl: "./select-view.component.html",
})
export class SelectViewComponent {
  protected style = colorful as any as StyleSpecification;

  protected usageLocations: Signal<
    | undefined
    | FeatureCollection<Point, WaterRightsServiceService.UsageLocations[0]>
  >;

  constructor(private service: WaterRightsServiceService) {
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

    effect(() => console.log(this.usageLocations()));
  }
}
