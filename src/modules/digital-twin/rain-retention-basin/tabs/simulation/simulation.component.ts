import { Component, signal, WritableSignal } from '@angular/core';
import { DrainageRule, DrainageRulesComponent } from "../../../common/drainage-rules/drainage-rules.component";
import { signals } from '../../../../../common/signals';
import { ModelViewComponent } from "../../model-view/model-view.component";
import { SimulationIntervalOption, SimulationParameter } from '../../../common/types/SimulationTypes';
import { WaterLevelComponent } from "../../../common/water-level/water-level.component";
import { RainForecastComponent } from "../../../common/rain-forecast/rain-forecast.component";

@Component({
  selector: "rrb-simulation",
  imports: [
    DrainageRulesComponent,
    ModelViewComponent,
    WaterLevelComponent,
    RainForecastComponent
],
  templateUrl: './simulation.component.html'
})
export class SimulationComponent {
  protected waterLevelSlider: WritableSignal<number> = signal(0);
  protected waterLevel: WritableSignal<number> = signal(this.waterLevelSlider());
 
  protected intervalForecast: WritableSignal<SimulationIntervalOption> = signal('5 min');
  private rainAmounts: number[] = [1.2, 1.4, 1.6, 1.9, 2.5, 3.2, 4.6, 8.9, 1.2, 1.1, 0.9, 0.8, 0.4, 0.4, 0.4, 0.4, 0.3, 0.3, 0.3, 0.3, 0.2, 0.2, 0.2, 0.2];
  protected rainForecast: WritableSignal<SimulationParameter[]> = signal(Array.from({length: this.rainAmounts.length}, (_, i) => ({time: ((i+1)*5).toString(), rainAmount: this.rainAmounts[i], waterLevel: 0})));

  protected drainageRules: WritableSignal<DrainageRule[]> = signal([
      {title: "Mittelstarker Regenfall", rainAmount: 5, rainDuration: 15, targetLevel: 40, drainageForerun: 180, open: signals.toggleable(true)},
      {title: "Starkregen", rainAmount: 15, rainDuration: 10, targetLevel: 20, drainageForerun: 240, open: signals.toggleable(false)},
  ]);

  protected volume: WritableSignal<number> = signal(14325);
  protected catchmentArea: WritableSignal<number> = signal(92.29);
  protected pavedArea: WritableSignal<number> = signal(38.34);
  protected unpavedArea: WritableSignal<number> = signal(53.95);
}
