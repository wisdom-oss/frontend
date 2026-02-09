import { AfterViewInit, Component, effect, Input, signal, viewChild, WritableSignal } from '@angular/core';
import { signals } from '../../../../common/signals';
import { SimulationIntervalOption, SimulationParameter } from '../types/SimulationTypes';
import { randInt } from 'three/src/math/MathUtils.js';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { TranslateDirective } from '@ngx-translate/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData } from 'chart.js';
import { remixArrowDownSLine, remixContrastDrop2Line, remixRainyLine, remixTimeLine } from '@ng-icons/remixicon';

@Component({
  selector: "rain-forecast",
  imports: [
    NgIconComponent,
    TranslateDirective,
    BaseChartDirective
  ],
  templateUrl: './rain-forecast.component.html',
  providers: [
    provideIcons({
      remixContrastDrop2Line,
      remixRainyLine,
      remixTimeLine,
      remixArrowDownSLine
    }),
  ],
})
export class RainForecastComponent implements AfterViewInit {
  @Input() intervalForecast!: WritableSignal<SimulationIntervalOption>;
  @Input() rainForecast: WritableSignal<SimulationParameter[]> = signal([]);

  protected checkedRainForecast: signals.ToggleableSignal = signals.toggleable(false);
  protected rainForecastModalOpen: signals.ToggleableSignal = signals.toggleable(false);
  
  protected rainForecastModal: WritableSignal<SimulationParameter[]> = signal(this.rainForecast());
  protected durationForecast: WritableSignal<number> = signal(this.rainForecast().length);

  constructor() {
    effect(() => {
      this.updateChart(this.rainForecast());
    });
  };

  ngAfterViewInit(): void {
    this.updateChart(this.rainForecast());
  };

  protected chart = viewChild(BaseChartDirective);

  protected dataRainForecast: ChartData<'bar', SimulationParameter[]> = {
    datasets: [{
      data: this.rainForecast(),
      parsing: {
        xAxisKey: 'time',
        yAxisKey: 'rainAmount'
      },
    }],
  };

  onToogleClick(event: MouseEvent, signal: signals.ToggleableSignal) {
    event.preventDefault();
    signal.toggle(); 
  };

  updateChart(data: SimulationParameter[]) {
    this.durationForecast.set(data.length);
    const chart = this.chart()?.chart;
      
    if (chart) {
      chart.data.datasets[0].data = data;
      chart.update();
    }
  };

  updateForecastModal(index: number, newRainAmount: number) {
    const updated = this.rainForecastModal().map((item, i) =>
      i === index ? { ...item, rainAmount: newRainAmount } : item
    );
    this.rainForecastModal.set(updated);
  };
  
  updateLengthForecastModal() {
    const length = this.rainForecastModal().length;
    const duration = this.durationForecast();
  
    if (length < duration) {
      const factor = parseInt(this.intervalForecast().split(' ')[0]);
      const newArray = Array.from({length: duration - length}, (_, i) => ({time: ((i+1+length)*factor).toString(), rainAmount: 0, waterLevel: 0}));
      this.rainForecastModal.set(this.rainForecastModal().concat(newArray));
    }
  
    if (length > duration) {
      const newArray = this.rainForecastModal().filter((_, i) => i < duration);
      this.rainForecastModal.set(newArray);
    }
  };
  
  updateIntervalForecastModal() {
    const factor = parseInt(this.intervalForecast().split(' ')[0]);
    const newArray = this.rainForecastModal().map((item, i) => {
      item.time = ((i+1)*factor).toString();
      return item;
    });
    this.rainForecastModal.set(newArray);
  };
  
  copyForecast(copy: WritableSignal<SimulationParameter[]>, copied: WritableSignal<SimulationParameter[]>) {
    copy.set(copied().map(item => ({ ...item })));
  };
  
  setForecastModalFromTime(time : string) {
    const newArray = this.rainForecastModal().map((item) => {
      item.rainAmount = randInt(0, 10);
      return item;
    });
    this.rainForecastModal.set(newArray);
  };
}
