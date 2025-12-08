import { Component, effect, signal, viewChild, WritableSignal } from '@angular/core';
import { DrainageRule, DrainageRulesComponent } from "../../../common/drainage-rules/drainage-rules.component";
import { signals } from '../../../../../common/signals';
import { ModelViewComponent } from "../../../common/model-view/model-view.component";
import { NgIconComponent, provideIcons } from "@ng-icons/core";
import { 
  remixContrastDrop2Line,
  remixRainyLine,
  remixTimeLine,
} from '@ng-icons/remixicon';
import { TranslateDirective } from '@ngx-translate/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData } from 'chart.js';

@Component({
  selector: "rrb-simulation",
  imports: [
    DrainageRulesComponent, 
    NgIconComponent,
    ModelViewComponent,
    TranslateDirective, 
    BaseChartDirective
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

    effect(() => {
      this.waterLevel.set(this.waterLevelSlider());
    });
  }

  protected chart = viewChild(BaseChartDirective);
  
  protected waterLevelSlider: WritableSignal<number> = signal(20);
  protected waterLevel: WritableSignal<number> = signal(this.waterLevelSlider());

  protected checkedRainForecast: signals.ToggleableSignal = signals.toggleable(false);
  protected rainForecastModalOpen: signals.ToggleableSignal = signals.toggleable(false);
  
  protected rainForecastModal: WritableSignal<{x: string, y: number}[]> = signal([]);
  protected durationForecast: WritableSignal<number> = signal(12);
  protected rainForecast: WritableSignal<{x: string, y: number}[]> = signal(Array.from({length: 12}, (_, i) => ({x: (i+1).toString(), y: 0})));

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

  changeForecast(currentForecast: WritableSignal<{x: string, y: number}[]>) {
    const length = currentForecast().length;
    const duration = this.durationForecast();

    if (length < duration) {
      let forecast = currentForecast();
      for (let i=length; i < duration; i++) {
        forecast.concat({x: (i+1).toString(), y: 0});
      }
      currentForecast.set(forecast);
    }
  };

  updateForecastModal(index: number, newY: number) {
    const updated = this.rainForecastModal().map((item, i) =>
      i === index ? { ...item, y: newY } : item
    );
    this.rainForecastModal.set(updated);
  };

  copyForecast(copy: WritableSignal<{x: string, y: number}[]>, copied: WritableSignal<{x: string, y: number}[]>) {
    copy.set(copied().map(item => ({ ...item })));
  };
}
