import {Component, computed, inject, Signal, signal} from "@angular/core";
import { LayerComponent, MapComponent, GeoJSONSourceComponent, PopupComponent } from "@maplibre/ngx-maplibre-gl";
import colorful from "../../../../assets/map/styles/colorful.json";
import { StyleSpecification } from "maplibre-gl";
import { RrbDigitalTwinService } from "../../../../api/rrb-digital-twin.service";
import { RainRetentionBasinService } from "../rain-retention-basin.service";
import { TranslateDirective } from "@ngx-translate/core";
import { ActivatedRoute, Router } from "@angular/router";

@Component({
  imports: [
    TranslateDirective,
    LayerComponent,
    MapComponent,
    GeoJSONSourceComponent,
    PopupComponent,
  ],
  templateUrl: "./select-basin-view.component.html",
})
export class SelectBasinViewComponent {
  protected service = inject(RainRetentionBasinService);

  constructor(private router: Router, private route: ActivatedRoute) {}

  protected style = colorful as any as StyleSpecification;

  protected basins: Signal<RrbDigitalTwinService.BasinFeatureCollection> = computed(() => this.service.data.basins());
  
  protected hoveredBasin = signal<RrbDigitalTwinService.BasinFeature | null>(null);

  protected openTabView(selectedBasin: RrbDigitalTwinService.BasinFeature) {
    this.router.navigate(["tabs"], {
      relativeTo: this.route,
      queryParams: { id: selectedBasin.id },
    });
  }
}
