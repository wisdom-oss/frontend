import { Component, signal, WritableSignal } from '@angular/core';
import { ModelViewComponent } from "../../model-view/model-view.component";
import { signals } from '../../../../../common/signals';
import { DrainageRule, DrainageRulesComponent } from "../../../common/drainage-rules/drainage-rules.component";
import { WaterLevelComponent } from "../../../common/water-level/water-level.component";
import { RainForecastComponent } from "../../../common/rain-forecast/rain-forecast.component";
import { SimulationIntervalOption, SimulationParameter } from '../../../common/types/SimulationTypes';

@Component({
  selector: "braintank-simulation",
  imports: [
    ModelViewComponent,
    DrainageRulesComponent,
    WaterLevelComponent,
    RainForecastComponent
],
  templateUrl: './simulation.component.html'
})
export class SimulationComponent {
  protected waterLevelSlider: WritableSignal<number> = signal(20);
  protected waterLevel: WritableSignal<number> = signal(this.waterLevelSlider());
  
  protected intervalForecast: WritableSignal<SimulationIntervalOption> = signal('5 min');
  protected rainForecast: WritableSignal<SimulationParameter[]> = signal([]);

  protected drainageRules: WritableSignal<DrainageRule[]> = signal([
    {title: "Mittelstarker Regenfall", rainAmount: 5, rainDuration: 15, targetLevel: 40, drainageForerun: 180, open: signals.toggleable(true)},
    {title: "Starkregen", rainAmount: 15, rainDuration: 10, targetLevel: 20, drainageForerun: 240, open: signals.toggleable(false)},
  ]);
}
