import {Component, computed, inject, Signal, signal} from "@angular/core";
import {RouterLinkActive, RouterLink, RouterOutlet} from "@angular/router";
import {provideIcons, NgIconComponent} from "@ng-icons/core";
import {
  remixGamepadLine,
  remixLineChartLine,
  remixMovieLine,
  remixProfileLine,
  remixMapPin2Line,
} from "@ng-icons/remixicon";
import { TranslateDirective } from "@ngx-translate/core";
import { RainRetentionBasinService } from "./rain-retention-basin.service";
import { LayerComponent, MapComponent, GeoJSONSourceComponent, PopupComponent } from "@maplibre/ngx-maplibre-gl";
import { StyleSpecification } from "maplibre-gl";
import colorful from "../../../assets/map/styles/colorful.json";

@Component({
  imports: [
    NgIconComponent,
    TranslateDirective,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    LayerComponent,
    MapComponent,
    GeoJSONSourceComponent,
    PopupComponent,
],
  templateUrl: "./rain-retention-basin.component.html",
  styleUrl: "./rain-retention-basin.component.scss",
  providers: [
    provideIcons({
      remixLineChartLine,
      remixMovieLine,
      remixProfileLine,
      remixGamepadLine,
      remixMapPin2Line,
    }),
  ],
})
export class RainRetentionBasinComponent {
  protected service = inject(RainRetentionBasinService);

  protected style = colorful as any as StyleSpecification;

  protected basins: Signal<GeoJSON.FeatureCollection> = computed(() => this.service.data.basins());
  
  protected isBasinSelected = signal(false);
  protected hoveredBasin = signal<GeoJSON.Feature | null>(null);
  protected selectedBasin = signal<GeoJSON.Feature | null>(null);
}
