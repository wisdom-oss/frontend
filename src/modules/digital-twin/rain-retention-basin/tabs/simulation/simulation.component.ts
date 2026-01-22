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
  protected waterLevelSlider: WritableSignal<number> = signal(20);
  protected waterLevel: WritableSignal<number> = signal(this.waterLevelSlider());

  protected checkedRainForecast: signals.ToggleableSignal = signals.toggleable(false);
  protected rainForecastModalOpen: signals.ToggleableSignal = signals.toggleable(false);
 
  protected intervalForecast: WritableSignal<SimulationIntervalOption> = signal('5 min');
  protected durationForecast: WritableSignal<number> = signal(12);
  protected rainForecast: WritableSignal<SimulationParameter[]> = signal(Array.from({length: 12}, (_, i) => ({time: ((i+1)*5).toString(), rainAmount: 2, waterLevel: (i+1)*5})));
  protected rainForecastModal: WritableSignal<SimulationParameter[]> = signal(this.rainForecast());

  protected drainageRules: WritableSignal<DrainageRule[]> = signal([
      {title: "Mittelstarker Regenfall", rainAmount: 5, rainDuration: 15, targetLevel: 40, drainageForerun: 180, open: signals.toggleable(true)},
      {title: "Starkregen", rainAmount: 15, rainDuration: 10, targetLevel: 20, drainageForerun: 240, open: signals.toggleable(false)},
  ]);

  protected volume: WritableSignal<number> = signal(14325);
  protected catchmentArea: WritableSignal<number> = signal(92.29);
  protected pavedArea: WritableSignal<number> = signal(38.34);
  protected unpavedArea: WritableSignal<number> = signal(53.95);
}
