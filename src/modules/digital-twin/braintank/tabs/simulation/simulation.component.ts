import { Component, effect, signal, viewChild, WritableSignal } from '@angular/core';
import { ModelViewComponent } from "../../model-view/model-view.component";
import { TranslateDirective } from '@ngx-translate/core';
import { NgIconComponent, provideIcons } from "@ng-icons/core";
import { 
  remixContrastDrop2Line,
  remixRainyLine,
  remixTimeLine,
} from '@ng-icons/remixicon';
import { signals } from '../../../../../common/signals';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData } from 'chart.js';
import { DrainageRule, DrainageRulesComponent } from "../../../common/drainage-rules/drainage-rules.component";

@Component({
  selector: "braintank-simulation",
  imports: [
    ModelViewComponent,
    TranslateDirective,
    NgIconComponent,
    BaseChartDirective,
    DrainageRulesComponent
],
  templateUrl: './simulation.component.html',
  providers: [
    provideIcons({
      remixContrastDrop2Line,
      remixRainyLine,
      remixTimeLine,
    }),
  ],
})
export class SimulationComponent {
  constructor() {
    effect(() => {
      const data = this.rainForecast();
      const chart = this.chart()?.chart;
      
      if (chart) {
        chart.data.datasets[0].data = data;
        chart.update();
      }
    });
  }

  protected chart = viewChild(BaseChartDirective);
  protected waterLevel: WritableSignal<number> = signal(50);
  protected checkedRainForecast: signals.ToggleableSignal = signals.toggleable(false);
  protected rainForecastModalOpen: signals.ToggleableSignal = signals.toggleable(false);
  
  protected rainForecastModal: WritableSignal<{x: string, y: number}[]> = signal([]);
  protected rainForecast: WritableSignal<{x: string, y: number}[]> = signal([{x: '16:00', y: 0}, {x: '16:15', y: 0}, {x: '16:30', y: 3}, {x: '16:45', y: 2}, {x: '17:00', y: 0}, {x: '17:15', y: 0}, {x: '17:30', y: 6}, {x: '17:45', y: 8}]);

  dataRainForecast: ChartData<'bar', {x: string, y: number}[]> = {
    datasets: [{
      data: this.rainForecast(),
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
  
  onToogleClick(event: MouseEvent, signal: signals.ToggleableSignal) {
    event.preventDefault();
    signal.toggle(); 
  };

  updateForecastModal(index: number, newY: number) {
    const updated = this.rainForecastModal().map((item, i) =>
      i === index ? { ...item, y: newY } : item
    );
    this.rainForecastModal.set(updated);
  }

  copyForecast(copy: WritableSignal<{x: string, y: number}[]>, copied: WritableSignal<{x: string, y: number}[]>) {
    copy.set(copied().map(item => ({ ...item })));
  }
}
