import {NgIf, NgForOf, TitleCasePipe, KeyValuePipe} from "@angular/common";
import {computed, effect, Component} from "@angular/core";
import {ReactiveFormsModule} from "@angular/forms";
import {provideIcons, NgIcon} from "@ng-icons/core";
import {remixBarChartBoxAiLine} from "@ng-icons/remixicon";
import {BaseChartDirective} from "ng2-charts";

import {UsageForecastsService} from "../../../../api/usage-forecasts.service";
import {signals} from "../../../../common/signals";
import {EmptyPipe} from "../../../../common/pipes/empty.pipe";

@Component({
  imports: [
    EmptyPipe,
    KeyValuePipe,
    NgForOf,
    NgIcon,
    NgIf,
    ReactiveFormsModule,
    TitleCasePipe,
    BaseChartDirective,
  ],
  templateUrl: "./result-data-view.component.html",
  styles: ``,
  providers: [
    provideIcons({
      remixBarChartBoxAiLine,
    }),
  ],
})
export class ResultDataViewComponent {
  protected availableAlgorithms;
  protected selectedAlgorithmIdentifier = signals.formControl("exponential");
  protected selectedAlgorithm = computed(() => {
    let available = this.availableAlgorithms() ?? [];
    let id = this.selectedAlgorithmIdentifier();
    return available.find(algo => algo.identifier == id);
  });

  constructor(private service: UsageForecastsService) {
    this.availableAlgorithms = signals.fromPromise(
      service.fetchAvailableAlgorithms(),
    );

    effect(() => console.log(this.selectedAlgorithm()));
  }
}
