import {input, Component} from "@angular/core";
import {TranslateDirective} from "@ngx-translate/core";
import {ChartData, ChartTypeRegistry} from "chart.js";
import {BaseChartDirective} from "ng2-charts";

@Component({
  selector: "chart",
  imports: [BaseChartDirective, TranslateDirective],
  templateUrl: "./chart.component.html",
})
export class ChartComponent {
  readonly header = input.required<string>();
  readonly chartData =
    input.required<
      ChartData<keyof ChartTypeRegistry, {x: string; y: number}[]>
    >();
  readonly text = input.required<string>();
  readonly suggestedMax = input.required<number>();
  readonly chartType = input.required<keyof ChartTypeRegistry>();
}
