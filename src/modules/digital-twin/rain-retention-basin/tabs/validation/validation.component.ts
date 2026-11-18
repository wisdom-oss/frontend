import {Component} from "@angular/core";
import {TranslateDirective} from "@ngx-translate/core";
import {ChartData} from "chart.js";

import {ChartComponent} from "../../../common/chart/chart.component";

@Component({
  selector: "rrb-validation",
  imports: [TranslateDirective, ChartComponent],
  templateUrl: "./validation.component.html",
})
export class ValidationComponent {
  data: ChartData<"bar", {x: string; y: number}[]> = {
    datasets: [
      {
        label: "Sensordaten",
        data: [
          {x: "0:00", y: 0.4},
          {x: "3:00", y: 0.8},
          {x: "6:00", y: 1.3},
          {x: "9:00", y: 1.9},
          {x: "12:00", y: 2.4},
          {x: "15:00", y: 3.2},
          {x: "18:00", y: 2.8},
          {x: "21:00", y: 2.6},
        ],
        parsing: {
          xAxisKey: "x",
          yAxisKey: "y",
        },
      },
      {
        label: "Vorhersage 1",
        data: [
          {x: "0:00", y: 0.2},
          {x: "3:00", y: 0.4},
          {x: "6:00", y: 0.7},
          {x: "9:00", y: 1.4},
          {x: "12:00", y: 2.0},
          {x: "15:00", y: 2.4},
          {x: "18:00", y: 2.3},
          {x: "21:00", y: 2.2},
        ],
        parsing: {
          xAxisKey: "x",
          yAxisKey: "y",
        },
      },
      {
        label: "Vorhersage 2",
        data: [
          {x: "0:00", y: 0.6},
          {x: "3:00", y: 1.0},
          {x: "6:00", y: 1.6},
          {x: "9:00", y: 2.2},
          {x: "12:00", y: 2.6},
          {x: "15:00", y: 3.4},
          {x: "18:00", y: 3.3},
          {x: "21:00", y: 3.3},
        ],
        parsing: {
          xAxisKey: "x",
          yAxisKey: "y",
        },
      },
    ],
  };
}
