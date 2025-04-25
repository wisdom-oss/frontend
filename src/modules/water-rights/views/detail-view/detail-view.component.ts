import {Component, computed, effect, Signal} from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { ActivatedRoute } from "@angular/router";

@Component({
  imports: [],
  templateUrl: "./detail-view.component.html",
})
export class DetailViewComponent {
  protected no: Signal<number>;
  
  constructor(route: ActivatedRoute) {
    let queryParams = toSignal(route.queryParamMap);
    this.no = computed(() => +queryParams()!.get("no")!);

    effect(() => console.log(this.no()));
  }
}
