import {NgIf, DOCUMENT} from "@angular/common";
import {
  computed,
  inject,
  signal,
  Component,
  Pipe,
  Signal,
  WritableSignal,
  PipeTransform,
} from "@angular/core";
import {ActivatedRoute} from "@angular/router";
import {
  ControlComponent,
  LayerComponent,
  MapComponent,
  GeoJSONSourceComponent,
  NavigationControlDirective,
} from "@maplibre/ngx-maplibre-gl";
import {provideIcons, NgIconComponent} from "@ng-icons/core";
import {
  remixArticleLine,
  remixCheckboxCircleLine,
  remixCloseCircleLine,
  remixHistoryFill,
  remixQuillPenLine,
  remixSparkling2Line,
  remixTimeLine,
  remixVerifiedBadgeLine,
} from "@ng-icons/remixicon";
import {TranslateDirective, TranslatePipe} from "@ngx-translate/core";
import dayjs from "dayjs";
import {BBox, FeatureCollection, Point} from "geojson";
import {StyleSpecification} from "maplibre-gl";

import * as turf from "@turf/turf";

import {GeoDataService} from "../../../../api/geo-data.service";
import {WaterRightsService} from "../../../../api/water-rights.service";
import colorful from "../../../../assets/map/styles/colorful.json";
import {signals} from "../../../../common/signals";
import {MapCursorDirective} from "../../../../common/directives/map-cursor.directive";
import {SomePipe} from "../../../../common/pipes/some.pipe";

type UsageLocations = FeatureCollection<
  Point,
  {id: number; name: string; waterRight: number}
>;

@Pipe({name: "kvfmt"})
export class KeyValueFormatPipe implements PipeTransform {
  transform(
    keyValue?: {key?: number; value?: string} | null,
  ): string | undefined {
    if (!keyValue) return undefined;
    let {key, value} = keyValue;

    if (key) {
      if (value) return `${key} ${value}`;
      return "" + key;
    }

    if (value) return value;
    return undefined;
  }
}

@Pipe({name: "ratefmt"})
export class RateFormatPipe implements PipeTransform {
  transform(rate: {
    value: number;
    unit: string;
    per: {Microseconds: number; Days: number; Months: number};
  }): string {
    let {value, unit} = rate;
    let per = dayjs
      .duration({
        milliseconds: rate.per.Microseconds * 1000,
        days: rate.per.Days,
        months: rate.per.Months,
      })
      .fuzzy()
      .formatUnit();

    return `${value} ${unit}/${per}`;
  }
}

@Pipe({name: "landrecordfmt"})
export class LandRecordPipe implements PipeTransform {
  transform(
    landRecord?: WaterRightsService.UsageLocation["landRecord"],
  ): undefined | string {
    if (!landRecord) return undefined;
    if ("district" in landRecord)
      return `${landRecord.district} ${landRecord.field}`;
    return landRecord.fallback;
  }
}

@Component({
  imports: [
    ControlComponent,
    GeoJSONSourceComponent,
    KeyValueFormatPipe,
    LayerComponent,
    MapComponent,
    MapCursorDirective,
    NavigationControlDirective,
    NgIconComponent,
    NgIf,
    RateFormatPipe,
    SomePipe,
    TranslateDirective,
    TranslatePipe,
    LandRecordPipe,
  ],
  templateUrl: "./detail-view.component.html",
  providers: [
    provideIcons({
      remixArticleLine,
      remixCheckboxCircleLine,
      remixCloseCircleLine,
      remixHistoryFill,
      remixQuillPenLine,
      remixSparkling2Line,
      remixTimeLine,
      remixVerifiedBadgeLine,
    }),
  ],
})
export class DetailViewComponent {
  protected data: Signal<undefined | WaterRightsService.WaterRightDetails>;
  protected document = inject(DOCUMENT);

  // prettier-ignore
  protected mapData: {
    style: StyleSpecification;
    usageLocations: ReturnType<typeof DetailViewComponent["buildUsageLocations"]>;
    fitBounds: Signal<undefined | BBox>,
    hover: WritableSignal<undefined | number>,
  };

  // prettier-ignore
  private asT<T>(value: T): T { return value }
  protected asTable = this.asT<[string, undefined | null | string][]>;
  protected asRates = this.asT<
    [string, undefined | null | WaterRightsService.Helper.Rate[]][]
  >;

  constructor(
    route: ActivatedRoute,
    service: WaterRightsService,
    geo: GeoDataService,
  ) {
    this.data = service.fetchWaterRightDetails(+route.snapshot.queryParams["no"]!);

    let usageLocations = DetailViewComponent.buildUsageLocations(
      geo,
      this.data,
    );

    this.mapData = {
      style: colorful as any as StyleSpecification,
      usageLocations,
      fitBounds: DetailViewComponent.buildFitBounds(usageLocations),
      hover: signal(undefined),
    };
  }

  private static buildUsageLocations(
    geo: GeoDataService,
    dataSignal: DetailViewComponent["data"],
  ): Signal<undefined | UsageLocations> {
    let allUsageLocations = signals.map(
      geo.fetchLayerContents(
        "water_right_usage_locations",
        undefined,
        dayjs.duration(1, "day"),
      ),
      locations => ({
        type: "FeatureCollection",
        features: (locations?.data ?? []).map(location => ({
          type: "Feature" as const,
          id: location.id,
          geometry: location.geometry as Point,
          properties: {
            id: location.id,
            name: location.name as string,
            waterRight: location.additionalProperties!["waterRight"]! as number,
          },
        })),
      }),
    );

    return computed(() => {
      let data = dataSignal();
      let usageLocations = allUsageLocations();
      if (!data || !usageLocations) return undefined;

      let usageLocationIds = data.usageLocations.map(({id}) => id);

      return {
        type: "FeatureCollection",
        features: usageLocations.features.filter(({properties: {id}}) =>
          usageLocationIds.includes(id),
        ),
      };
    });
  }

  private static buildFitBounds(
    usageLocationsSignal: Signal<undefined | UsageLocations>,
  ): Signal<undefined | BBox> {
    return computed(() => {
      let usageLocations = usageLocationsSignal();
      if (!usageLocations) return undefined;

      let bbox = turf.bbox(usageLocations);
      let [minX, minY, maxX, maxY] = bbox;
      let padding = 0.002;
      let paddedBbox = [
        minX - padding,
        minY - padding,
        maxX + padding,
        maxY + padding,
      ];
      return paddedBbox as BBox;
    });
  }
}
