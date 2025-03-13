import {computed, signal, viewChild, Component} from "@angular/core";
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
  protected countiesSource =
    viewChild.required<GeoJSONSourceComponent>("countiesSource");
  protected municipalsSource =
    viewChild.required<GeoJSONSourceComponent>("municipalsSource");

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

  protected geoData;

  constructor(geo: GeoDataService) {
    let counties = signals.fromPromise(
      geo.fetchLayerContents("nds_counties"),
      this.intoFeatureCollection,
    );
    let municipals = signals.fromPromise(
      geo.fetchLayerContents("nds_municipals"),
      this.intoFeatureCollection,
    );
    this.geoData = {
      counties: computed(() => counties()?.[0]),
      municipals: computed(() => municipals()?.[0]),
      loaded: computed(() => !!counties() && !!municipals()),
      attribution: computed(() => counties()?.[1]),
    };
  }

  private intoFeatureCollection<G extends Geometry>(
    contents: GeoDataService.LayerContents | null,
  ): [
    FeatureCollection<G>,
    Partial<{attribution: string; attributionURL: string}>,
  ] {
    let features: Feature<G>[] = [];

    console.log(contents);

    for (let content of contents?.data ?? []) {
      features.push({
        type: "Feature",
        geometry: content.geometry as G,
        properties: {
          key: content.key,
          name: content.name,
        },
      });
    }

    let featureCollection = {type: "FeatureCollection", features} as const;
    let attribution = {
      attribution: contents?.attribution ?? undefined,
      attributionURL: contents?.attributionURL ?? undefined,
    } as const;
    return [featureCollection, attribution];
  }

  protected onHover(event: {features?: Feature[]}) {
    let previousHover = this.selection.hover();
    if (previousHover) {
      let id = {id: previousHover};
      this.countiesSource().removeFeatureState(id, "hovered");
      this.municipalsSource().removeFeatureState(id, "hovered");
    }

    let hover: string | undefined = event.features?.[0].properties?.["key"];
    this.selection.hover.set(hover);
    if (hover) {
      let id = {id: hover};
      this.countiesSource().setFeatureState(id, {hovered: true});
      this.municipalsSource().setFeatureState(id, {hovered: true});
    }
  }

  protected onClick() {
    let hover = this.selection.hover();
    if (!hover) return;
    let id = {id: hover};

    if (this.mapControl.visibleLayer() == "counties") {
      if (this.selection.counties.has(hover)) {
        this.countiesSource().removeFeatureState(id, "selected");
        this.selection.counties.delete(hover);
        return;
      }

      this.countiesSource().setFeatureState(id, {selected: true});
      this.selection.counties.add(hover);
    }

    if (this.mapControl.visibleLayer() == "municipals") {
      if (this.selection.municipals.has(hover)) {
        this.municipalsSource().removeFeatureState(id, "selected");
        this.selection.municipals.delete(hover);
        return;
      }

      this.municipalsSource().setFeatureState(id, {selected: true});
      this.selection.municipals.add(hover);
    }
  }
}
