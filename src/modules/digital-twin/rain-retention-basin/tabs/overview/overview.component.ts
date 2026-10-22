import {
  computed,
  inject,
  signal,
  Component,
  WritableSignal,
  effect,
  Signal,
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
  remixRainyLine,
  remixTimeLine,
  remixTreeLine,
  remixWaterPercentLine,
} from "@ng-icons/remixicon";
import {TranslateDirective} from "@ngx-translate/core";
import {ChartData} from "chart.js";
import dayjs, {Dayjs} from "dayjs";
import {StyleSpecification} from "maplibre-gl";
import { map } from "rxjs";
import { MapComponent, GeoJSONSourceComponent, LayerComponent } from "@maplibre/ngx-maplibre-gl";

import colorful from "../../../../../assets/map/styles/colorful.json";
import {CarouselComponent} from "../../../common/carousel/carousel.component";
import {ChartComponent} from "../../../common/chart/chart.component";
import {ModelViewComponent} from "../../model-view/model-view.component";
import {RrbDigitalTwinService} from "../../../../../api/rrb-digital-twin.service";
import {RainRetentionBasinService} from "../../rain-retention-basin.service";

@Component({
  selector: "rrb-overview",
  imports: [
    TranslateDirective,
    NgIconComponent,
    CarouselComponent,
    ModelViewComponent,
    ChartComponent,
    RouterLink,
    RouterLinkActive,
    MapComponent,
    GeoJSONSourceComponent,
    LayerComponent
],
  templateUrl: "./overview.component.html",
  styleUrl: "./overview.component.scss",
  providers: [
    provideIcons({
      remixContrastDrop2Line,
      remixWaterPercentLine,
      remixTimeLine,
      remixHome8Line,
      remixRainyLine,
      remixMap2Fill,
      remixImageFill,
      remixCheckboxMultipleBlankFill,
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
  protected service = inject(RainRetentionBasinService);
  private route = inject(ActivatedRoute);

  readonly id = toSignal(
    this.route.queryParams.pipe(map(params => params['id'])),
    { initialValue: undefined }
  );

  readonly basin = signal<RrbDigitalTwinService.BasinFeature | undefined>(undefined);
  readonly basinLayer = computed(() => {});
  
  protected city = computed (() => this.basin()?.properties.city ?? "");
  protected name = computed (() => this.basin()?.properties.name ?? "");
  protected volume = computed(() => this.basin()?.properties.maxVolume ?? 0);

  constructor() {
    effect(() => {
      if (this.id()) {
        this.basin.set(this.service.getBasinById(this.id()));
      }
    });
  }

  protected time: WritableSignal<Dayjs> = signal(dayjs());
  protected waterLevel: WritableSignal<number> = signal(10);

  protected catchmentArea: WritableSignal<number> = signal(92.29);
  protected pavedArea: WritableSignal<number> = signal(38.34);
  protected unpavedArea: WritableSignal<number> = signal(53.95);

  protected params = toSignal(this.route.params);
  protected activeView = computed<"model" | "map" | "pictures">(
    () => this.params()?.["view"],
  );

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
}
