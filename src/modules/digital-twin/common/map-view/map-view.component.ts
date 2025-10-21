import { Component, Input } from '@angular/core';
import { MapComponent, LayerComponent, GeoJSONSourceComponent } from "@maplibre/ngx-maplibre-gl";
import { StyleSpecification } from 'maplibre-gl';
import colorful from "../../../../assets/map/styles/colorful.json";


@Component({
  selector: 'map-view',
  imports: [
    MapComponent,
    LayerComponent,
    GeoJSONSourceComponent,
  ],
  templateUrl: './map-view.component.html'
})
export class MapViewComponent {
  @Input() locations: GeoJSON.FeatureCollection = {type: 'FeatureCollection', features: []};
  @Input() zoom: number = 12;
  @Input() center: {lon: number, lat: number} = {lon: 8.21, lat: 53.14};

  protected style = colorful as any as StyleSpecification;
}
