import {Component, effect, Signal} from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { WaterRightsService } from "../../../../api/water-rights.service";
import { signals } from "../../../../common/signals";

@Component({
  imports: [],
  templateUrl: "./detail-view.component.html",
})
export class DetailViewComponent {
  protected waterRight: Signal<undefined | WaterRightsService.WaterRightDetails>;
  
  constructor(route: ActivatedRoute, service: WaterRightsService) {
    this.waterRight = signals.fromPromise(service.fetchWaterRightDetails(+route.snapshot.queryParams["no"]!));
  
    effect(() => console.log(this.waterRight()));
  }
}
