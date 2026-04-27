import {
  computed,
  inject,
  signal,
  Component,
  WritableSignal,
} from "@angular/core";
import {toSignal} from "@angular/core/rxjs-interop";
import {RouterLinkActive, RouterLink, ActivatedRoute} from "@angular/router";
import {provideIcons, NgIconComponent} from "@ng-icons/core";
import {
  remixArrowLeftWideLine,
  remixArrowRightWideLine,
  remixBox2Line,
  remixCheckboxMultipleBlankFill,
  remixCollageLine,
  remixCommunityLine,
  remixContrastDrop2Line,
  remixHome8Line,
  remixImageFill,
  remixInfoCardLine,
  remixMap2Fill,
  remixMapPin2Fill,
  remixMapPin2Line,
  remixRainyLine,
  remixTimeLine,
  remixTreeLine,
  remixWaterPercentLine,
} from "@ng-icons/remixicon";
import {TranslateDirective} from "@ngx-translate/core";
import {ChartData} from "chart.js";
import dayjs, {Dayjs} from "dayjs";
import {StyleSpecification} from "maplibre-gl";

import colorful from "../../../../../assets/map/styles/colorful.json";
import {CarouselComponent} from "../../../common/carousel/carousel.component";
import {ChartComponent} from "../../../common/chart/chart.component";
import {MapViewComponent} from "../../../common/map-view/map-view.component";
import {ModelViewComponent} from "../../model-view/model-view.component";

@Component({
  selector: "rrb-overview",
  imports: [
    TranslateDirective,
    NgIconComponent,
    CarouselComponent,
    MapViewComponent,
    ModelViewComponent,
    ChartComponent,
    RouterLink,
    RouterLinkActive,
  ],
  templateUrl: "./overview.component.html",
  styleUrl: "./overview.component.scss",
  providers: [
    provideIcons({
      remixContrastDrop2Line,
      remixWaterPercentLine,
      remixTimeLine,
      remixHome8Line,
      remixMapPin2Line,
      remixRainyLine,
      remixMap2Fill,
      remixImageFill,
      remixCheckboxMultipleBlankFill,
      remixMapPin2Fill,
      remixArrowLeftWideLine,
      remixArrowRightWideLine,
      remixCommunityLine,
      remixInfoCardLine,
      remixTreeLine,
      remixCollageLine,
      remixBox2Line,
    }),
  ],
})
export class OverviewComponent {
  protected time: WritableSignal<Dayjs> = signal(dayjs());
  protected waterLevel: WritableSignal<number> = signal(10);

  protected lat: WritableSignal<number> = signal(52.524639);
  protected long: WritableSignal<number> = signal(8.185833);
  protected city: WritableSignal<string> = signal("Damme");
  protected name: WritableSignal<string> = signal("Nordhofe");

  protected volume: WritableSignal<number> = signal(14325);
  protected catchmentArea: WritableSignal<number> = signal(92.29);
  protected pavedArea: WritableSignal<number> = signal(38.34);
  protected unpavedArea: WritableSignal<number> = signal(53.95);

  protected route = inject(ActivatedRoute);
  protected params = toSignal(this.route.params);
  protected activeView_ = computed<"model" | "map" | "pictures">(
    () => this.params()?.["view"],
  );

  protected activeView: WritableSignal<"model" | "map" | "pictures"> =
    signal("model");

  setActiveView(view: "model" | "map" | "pictures") {
    this.activeView.set(view);
  }

  dataCurrentForecast: ChartData<"bar", {x: string; y: number}[]> = {
    datasets: [
      {
        data: [
          {x: "16:00", y: 0},
          {x: "16:15", y: 0},
          {x: "16:30", y: 3},
          {x: "16:45", y: 2},
          {x: "17:00", y: 0},
          {x: "17:15", y: 0},
          {x: "17:30", y: 6},
          {x: "17:45", y: 8},
        ],
        parsing: {
          xAxisKey: "x",
          yAxisKey: "y",
        },
      },
    ],
  };

  protected style = colorful as any as StyleSpecification;

  protected locations: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [this.long(), this.lat()],
        },
        properties: {
          name: "Test Point",
        },
      },
    ],
  };
}
