import {signal, Component} from "@angular/core";
import {provideIcons, NgIcon} from "@ng-icons/core";
import {remixBarChartBoxAiLine} from "@ng-icons/remixicon";

import {UsageForecastsService} from "../../../../api/usage-forecasts.service";
import {signals} from "../../../../common/signals";

@Component({
  imports: [NgIcon],
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
  protected selectedAlgorithm = signal<string>("linear");

  constructor(private service: UsageForecastsService) {
    this.availableAlgorithms = signals.fromPromise(
      service.fetchAvailableAlgorithms(),
    );
  }
}
