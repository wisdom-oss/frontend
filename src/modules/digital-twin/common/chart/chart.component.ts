import { Component, Input } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartTypeRegistry } from 'chart.js';
import { TranslateDirective } from '@ngx-translate/core';

@Component({
  selector: 'chart',
  imports: [
    BaseChartDirective,
    TranslateDirective
  ],
  templateUrl: './chart.component.html'
})
export class ChartComponent {
  @Input() header : string = '';
  @Input() chartData : ChartData<keyof ChartTypeRegistry, {x: string, y: number}[]> = {datasets: []};
  @Input() text: string = '';
  @Input() suggestedMax: number = 0;
  @Input() chartType : keyof ChartTypeRegistry = 'line';
}
