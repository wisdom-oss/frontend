import { Component, effect, signal, viewChild, WritableSignal } from '@angular/core';
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
  remixDeleteBin6Line,
  remixBookMarkedLine
} from '@ng-icons/remixicon';
import { signals } from '../../../../../common/signals';
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
      remixBookMarkedLine,
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
  protected drainageRulesModalOpen: signals.ToggleableSignal = signals.toggleable(false);
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
  protected drainageRules: WritableSignal<DrainageRule[]>= signal(this.rules);
  protected newDrainageRule: DrainageRule = {title: "", rainAmount: 0, rainDuration: 0, targetLevel: 0, drainageForerun: 0, open: signals.toggleable(true)}
  protected drainageRuleModal: WritableSignal<DrainageRule>= signal(this.newDrainageRule);
  protected drainageRuleModalIndex: WritableSignal<number|undefined> = signal(undefined);
  
  onToogleClick(event: MouseEvent, signal: signals.ToggleableSignal) {
    event.preventDefault();
    signal.toggle(); 
  };

  copyDrainageRule(index: number) {
    this.drainageRuleModal.set(this.drainageRules()[index]);
  }

  deleteDrainageRule(index: number) {
    this.drainageRules.set(this.drainageRules().filter(( _ , i) => index !== i));
  }

  updateDrainageRules() {
    if (this.drainageRuleModalIndex() === undefined) {
      this.drainageRules().push(this.drainageRuleModal());
    } else {
      this.drainageRules.set(this.drainageRules().map((item, i) => 
        i === this.drainageRuleModalIndex() ? this.drainageRuleModal() : item
      ));
    }
  }

  updateDrainageRuleTitle(value: string) {
    this.drainageRuleModal.set({...this.drainageRuleModal(), title: value});
  }

  updateDrainageRule(attribute: string, value: number) {
    switch (attribute) {
      case "rainAmount":
        this.drainageRuleModal.set({...this.drainageRuleModal(), rainAmount: value});
        break;
      case "rainDuration":
        this.drainageRuleModal.set({...this.drainageRuleModal(), rainDuration: value});
        break;
      case "targetLevel":
        this.drainageRuleModal.set({...this.drainageRuleModal(), targetLevel: value});
        break;
      case "drainageForerun":
        this.drainageRuleModal.set({...this.drainageRuleModal(), drainageForerun: value});
        break;
    }
  }

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
