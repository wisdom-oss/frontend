import {signal, Component, WritableSignal} from "@angular/core";
import {TranslateDirective} from "@ngx-translate/core";
import {ChartData} from "chart.js";

import {signals} from "../../../../../common/signals";
import {ChartComponent} from "../../../common/chart/chart.component";
import {
  DrainageRulesComponent,
  DrainageRule,
} from "../../../common/drainage-rules/drainage-rules.component";
import {ModelViewComponent} from "../../model-view/model-view.component";

@Component({
  selector: "rrb-control",
  imports: [
    DrainageRulesComponent,
    ModelViewComponent,
    TranslateDirective,
    ChartComponent,
  ],
  templateUrl: "./control.component.html",
})
export class ControlComponent {
  protected waterLevel: WritableSignal<number> = signal(10);

  protected city: WritableSignal<string> = signal("Damme");
  protected name: WritableSignal<string> = signal("Nordhofe");

  readonly activeControl = signal<"manual" | "semi-automatic" | "automatic">(
    "manual",
  );

  protected drainageRules: WritableSignal<DrainageRule[]> = signal([
    {
      title: "Mittelstarker Regenfall",
      rainAmount: 5,
      rainDuration: 15,
      targetLevel: 40,
      drainageForerun: 180,
      open: signals.toggleable(true),
    },
    {
      title: "Starkregen",
      rainAmount: 15,
      rainDuration: 10,
      targetLevel: 20,
      drainageForerun: 240,
      open: signals.toggleable(false),
    },
  ]);

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
}
