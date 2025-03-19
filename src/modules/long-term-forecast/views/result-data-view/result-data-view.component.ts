import {computed, effect, Component} from "@angular/core";
import {ReactiveFormsModule} from "@angular/forms";
import {provideIcons, NgIcon} from "@ng-icons/core";
import {remixBarChartBoxAiLine} from "@ng-icons/remixicon";

import {UsageForecastsService} from "../../../../api/usage-forecasts.service";
import {signals} from "../../../../common/signals";

@Component({
  imports: [NgIcon, ReactiveFormsModule],
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
