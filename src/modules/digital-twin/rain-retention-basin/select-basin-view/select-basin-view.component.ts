import {Component, computed, inject, Signal, signal} from "@angular/core";
import { LayerComponent, MapComponent, GeoJSONSourceComponent, PopupComponent } from "@maplibre/ngx-maplibre-gl";
import colorful from "../../../../assets/map/styles/colorful.json";
import { LngLatLike, StyleSpecification } from "maplibre-gl";
import { RrbDigitalTwinService } from "../../../../api/rrb-digital-twin.service";
import { RainRetentionBasinService } from "../rain-retention-basin.service";
import { TranslateDirective } from "@ngx-translate/core";
import { ActivatedRoute, Router } from "@angular/router";
import { centerOfMass } from "@turf/turf";
import { FeatureCollection } from "geojson";
import { provideIcons } from "@ng-icons/core";
import { remixMapPin2Line } from "@ng-icons/remixicon";

@Component({
  imports: [
    TranslateDirective,
    LayerComponent,
    MapComponent,
    GeoJSONSourceComponent,
    PopupComponent,
  ],
  templateUrl: "./select-basin-view.component.html",
  providers: [
    provideIcons({
      remixMapPin2Line,
    }),
  ],
})
export class SelectBasinViewComponent {
  protected service = inject(RainRetentionBasinService);

  constructor(private router: Router, private route: ActivatedRoute) {}

  protected style = colorful as any as StyleSpecification;

  protected basins: Signal<RrbDigitalTwinService.BasinFeatureCollection> = computed(() => this.service.data.basins());
  protected basinMarkers = computed<FeatureCollection>(() => {
    const markerFeatures = this.basins().features.map(feature => {
      const center = centerOfMass(feature); 

      center.properties = { ...feature.properties };
      if (feature.id) center.id = feature.id;

      return center;
    });

    return {
      type: 'FeatureCollection',
      features: markerFeatures
    };
  });
  
  protected hoveredBasin = signal<RrbDigitalTwinService.BasinFeature | null>(null);

  protected openTabView(selectedBasin: RrbDigitalTwinService.BasinFeature) {
    this.router.navigate(["tabs"], {
      relativeTo: this.route,
      queryParams: { id: selectedBasin.id },
    });
  }

  protected getLngLat(geometry: GeoJSON.Geometry) : LngLatLike {
    const center = centerOfMass(geometry).geometry.coordinates;
    return [center[0], center[1]]
  }
}
