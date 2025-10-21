import { Component } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData } from 'chart.js';
import { TranslateDirective } from '@ngx-translate/core';

@Component({
  selector: 'braintank-history',
  imports: [
    BaseChartDirective,
    TranslateDirective,
    
  ],
  templateUrl: './history.component.html'
})
export class HistoryComponent {
  dataWaterLevel: ChartData<'line', {x: string, y: number}[]> = {
    datasets: [{
      data: [{x: '0:00', y: 30}, {x: '3:00', y: 55}, {x: '6:00', y: 70}, {x: '9:00', y: 50}, {x: '12:00', y: 75}, {x: '15:00', y: 90}, {x: '18:00', y: 80}, {x: '21:00', y: 60}],
      parsing: {
        xAxisKey: 'x',
        yAxisKey: 'y'
      },
      fill: true,
    }],
  };

  dataDrainage: ChartData<'bar', {x: string, y: number}[]> = {
    datasets: [{
      data: [{x: '0:00', y: 0}, {x: '3:00', y: 0}, {x: '6:00', y: 30}, {x: '9:00', y: 20}, {x: '12:00', y: 0}, {x: '15:00', y: 0}, {x: '18:00', y: 40}, {x: '21:00', y: 60}],
      parsing: {
        xAxisKey: 'x',
        yAxisKey: 'y'
      },
    }],
  };

  dataRainForecast: ChartData<'bar', {x: string, y: number}[]> = {
    datasets: [{
      data: [{x: '0:00', y: 0}, {x: '3:00', y: 5}, {x: '6:00', y: 2}, {x: '9:00', y: 0}, {x: '12:00', y: 3}, {x: '15:00', y: 2}, {x: '18:00', y: 8}, {x: '21:00', y: 16}],
      parsing: {
        xAxisKey: 'x',
        yAxisKey: 'y'
      },
    }],
  };
}
