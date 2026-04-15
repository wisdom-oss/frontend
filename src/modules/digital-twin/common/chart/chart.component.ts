import {Component, Input} from "@angular/core";
import {TranslateDirective} from "@ngx-translate/core";
import {ChartData, ChartTypeRegistry} from "chart.js";
import {BaseChartDirective} from "ng2-charts";

@Component({
  selector: "chart",
  imports: [BaseChartDirective, TranslateDirective],
  templateUrl: "./chart.component.html",
})
export class ChartComponent {
  @Input() header: string = "";
  @Input() chartData: ChartData<
    keyof ChartTypeRegistry,
    {x: string; y: number}[]
  > = {datasets: []};
  @Input() text: string = "";
  @Input() suggestedMax: number = 0;
  @Input() chartType: keyof ChartTypeRegistry = "line";
}
