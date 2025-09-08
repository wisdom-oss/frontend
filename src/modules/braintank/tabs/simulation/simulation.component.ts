import { Component, signal, WritableSignal } from '@angular/core';
import { ModelViewComponent } from "../../model-view/model-view.component";
import { TranslateDirective } from '@ngx-translate/core';
import { NgIconComponent, provideIcons } from "@ng-icons/core";
import { 
  remixContrastDrop2Line,
  remixWaterPercentLine,
  remixRainyLine,
  remixArrowUpSLine,
  remixArrowDownSLine,
  remixTimeLine,
  remixHistoryLine,
  remixEditLine,
  remixDeleteBin6Line
} from '@ng-icons/remixicon';
import { signals } from '../../../../common/signals';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData } from 'chart.js';

type DrainageRule = {
  title: string,
  rainAmount: number,
  rainDuration: number,
  targetLevel: number,
  drainageForerun: number,
  open: signals.ToggleableSignal,
}

@Component({
  selector: "braintank-simulation",
  imports: [
    ModelViewComponent,
    TranslateDirective,
    NgIconComponent,
    BaseChartDirective,
  ],
  templateUrl: './simulation.component.html',
  providers: [
    provideIcons({
      remixContrastDrop2Line,
      remixWaterPercentLine,
      remixRainyLine,
      remixArrowUpSLine,
      remixArrowDownSLine,
      remixTimeLine,
      remixHistoryLine,
      remixEditLine,
      remixDeleteBin6Line,
    }),
  ],
})
export class SimulationComponent {
  protected waterLevel: WritableSignal<number> = signal(50);
  protected checkedWaterLevel: signals.ToggleableSignal = signals.toggleable(false);
  protected checkedDrainage: signals.ToggleableSignal = signals.toggleable(false);
  protected checkedRainForecast: signals.ToggleableSignal = signals.toggleable(false);

  dataRainForecast: ChartData<'bar', {x: string, y: number}[]> = {
    datasets: [{
      data: [{x: '16:00', y: 0}, {x: '16:15', y: 0}, {x: '16:30', y: 3}, {x: '16:45', y: 2}, {x: '17:00', y: 0}, {x: '17:15', y: 0}, {x: '17:30', y: 6}, {x: '17:45', y: 8}],
      parsing: {
        xAxisKey: 'x',
        yAxisKey: 'y'
      },
    }],
  };

  rules: DrainageRule[] = [
    {title: "Mittelstarker Regenfall", rainAmount: 5, rainDuration: 15, targetLevel: 40, drainageForerun: 10, open: signals.toggleable(true)},
    {title: "Starkregen", rainAmount: 15, rainDuration: 30, targetLevel: 20, drainageForerun: 30, open: signals.toggleable(false)},
  ];
  protected drainageRules: WritableSignal<DrainageRule[]>= signal(this.rules);
  
  onToogleClick(event: MouseEvent, signal: signals.ToggleableSignal) {
    event.preventDefault();
    signal.toggle(); 
  };
}
