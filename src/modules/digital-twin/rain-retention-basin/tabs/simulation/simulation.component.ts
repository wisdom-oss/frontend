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

export type SimulationParameter = {
  time: string,
  rainAmount: number, 
  waterLevel: number
}

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

    effect(() => {
      this.updateLengthForecastModal(this.durationForecast());
    });
  }

  protected chart = viewChild(BaseChartDirective);
  
  protected waterLevelSlider: WritableSignal<number> = signal(0);
  protected waterLevel: WritableSignal<number> = signal(this.waterLevelSlider());

  protected checkedRainForecast: signals.ToggleableSignal = signals.toggleable(false);
  protected rainForecastModalOpen: signals.ToggleableSignal = signals.toggleable(false);
  
  protected durationForecast: WritableSignal<number> = signal(12);
  protected rainForecast: WritableSignal<SimulationParameter[]> = signal(Array.from({length: 12}, (_, i) => ({time: (i+1).toString(), rainAmount: 2, waterLevel: (i+1)*5})));
  protected rainForecastModal: WritableSignal<SimulationParameter[]> = signal(this.rainForecast());

  dataRainForecast: ChartData<'bar', SimulationParameter[]> = {
    datasets: [{
      data: this.rainForecast(),
      parsing: {
        xAxisKey: 'time',
        yAxisKey: 'rainAmount'
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

  updateForecastModal(index: number, newRainAmount: number) {
    const updated = this.rainForecastModal().map((item, i) =>
      i === index ? { ...item, rainAmount: newRainAmount } : item
    );
    this.rainForecastModal.set(updated);
  };

  updateLengthForecastModal(duration: number) {
    const length = this.rainForecastModal().length;

    if (length < duration) {
      console.log("Length: " + length + ", Duration: " + this.durationForecast());

      const newArray = Array.from({length: duration - length}, (_, i) => ({time: (i+1+length).toString(), rainAmount: 0, waterLevel: 0}));
      this.rainForecastModal.set(this.rainForecastModal().concat(newArray));
    }

    if (length > duration) {
      console.log("Length: " + length + ", Duration: " + this.durationForecast());

      const newArray = this.rainForecastModal().filter((_, i) => i < duration);
      this.rainForecastModal.set(newArray);
    }
  }

  copyForecast(copy: WritableSignal<SimulationParameter[]>, copied: WritableSignal<SimulationParameter[]>) {
    copy.set(copied().map(item => ({ ...item })));
  };
}
