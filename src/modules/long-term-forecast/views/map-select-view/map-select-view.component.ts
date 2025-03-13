import {computed, effect, signal, Component, Signal} from "@angular/core";
import {
  ControlComponent,
  LayerComponent,
  MapComponent,
  GeoJSONSourceComponent,
  NavigationControlDirective,
} from "@maplibre/ngx-maplibre-gl";
import {provideIcons, NgIconComponent} from "@ng-icons/core";
import {remixStackFill} from "@ng-icons/remixicon";
import {TranslateDirective} from "@ngx-translate/core";
import {FeatureCollection, Feature, Geometry} from "geojson";
import {StyleSpecification} from "maplibre-gl";

import {GeoDataService} from "../../../../api/geo-data.service";
import colorful from "../../../../assets/map/styles/colorful.json";
import {signals} from "../../../../common/signals";

@Component({
  imports: [
    ControlComponent,
    GeoJSONSourceComponent,
    LayerComponent,
    MapComponent,
    NavigationControlDirective,
    NgIconComponent,
    TranslateDirective,
  ],
  templateUrl: "./map-select-view.component.html",
  styles: ``,
  providers: [
    provideIcons({
      remixStackFill,
    }),
  ],
})
export class MapSelectViewComponent {
  protected style = colorful as any as StyleSpecification;

  protected mapControl = {
    possibleLayers: ["counties", "municipals"] as const,
    visibleLayer: signal<"counties" | "municipals">("counties"),
    collapsed: signal(false),
  };

  protected selection = {
    hover: signal<string | undefined>(undefined),
    counties: new Set<string>(),
    municipals: new Set<string>(),
  };

  private geoData;

  protected sources = {
    counties: computed(() =>
      this.updateFeatureCollection(this.geoData.counties),
    ),
    municipals: computed(() =>
      this.updateFeatureCollection(this.geoData.municipals),
    ),
  };

  constructor(geo: GeoDataService) {
    this.geoData = {
      counties: signals.fromPromise(
        geo.fetchLayerContents("nds_counties"),
        this.intoFeatureCollection,
      ),
      municipals: signals.fromPromise(
        geo.fetchLayerContents("nds_municipals"),
        this.intoFeatureCollection,
      ),
    };

    effect(() => console.log(this.selection.hover()));
  }

  private intoFeatureCollection<G extends Geometry>(
    contents: GeoDataService.LayerContents | null,
  ): FeatureCollection<G> {
    let features: Feature<G>[] = [];
    let selected = 0;

    for (let content of contents?.data ?? []) {
      features.push({
        type: "Feature",
        geometry: content.geometry as G,
        id: content.id,
        properties: {
          key: content.key,
          selected: !!(selected++ % 3),
        },
      });
    }

    return {type: "FeatureCollection", features};
  }

  protected onLayerMouseMove(event: {features?: Feature[]}) {
    console.log(event.features?.[0].properties);
    this.selection.hover.set(event.features?.[0].properties?.["key"]);
  }

  // TODO: update collection in place instead
  private updateFeatureCollection(
    featureCollection: Signal<undefined | FeatureCollection>,
  ): undefined | FeatureCollection {
    let collection = featureCollection();
    let hover = this.selection.hover();
    if (!collection) return undefined;
    let features = collection.features.map(feature => {
      let key = feature.properties!["key"] as string;
      feature.properties!["hover"] = hover == key;
      return feature;
    });
    return {type: "FeatureCollection", features};
  }
}
