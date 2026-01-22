import { Component, signal, WritableSignal } from '@angular/core';
import { DrainageRule, DrainageRulesComponent } from "../../../common/drainage-rules/drainage-rules.component";
import { signals } from '../../../../../common/signals';
import { ModelViewComponent } from "../../model-view/model-view.component";
import { TranslateDirective } from '@ngx-translate/core';

@Component({
  selector: "rrb-control",
  imports: [
    DrainageRulesComponent,
    ModelViewComponent,
    TranslateDirective,
],
  templateUrl: './control.component.html'
})
export class ControlComponent {
  protected waterLevel: WritableSignal<number> = signal(10);
  
  protected activeControl = signal<'manual' | 'semi-automatic' | 'automatic'>('manual'); 

  setActiveControl(control: 'manual' | 'semi-automatic' | 'automatic') {
    this.activeControl.set(control);
  }

  protected drainageRules: WritableSignal<DrainageRule[]> = signal([
      {title: "Mittelstarker Regenfall", rainAmount: 5, rainDuration: 15, targetLevel: 40, drainageForerun: 180, open: signals.toggleable(true)},
      {title: "Starkregen", rainAmount: 15, rainDuration: 10, targetLevel: 20, drainageForerun: 240, open: signals.toggleable(false)},
  ]);
}
