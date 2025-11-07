import { Component } from '@angular/core';
import { DrainageRule, DrainageRulesComponent } from "../../../common/drainage-rules/drainage-rules.component";
import { signals } from '../../../../../common/signals';

@Component({
  selector: "rrb-control",
  imports: [DrainageRulesComponent],
  templateUrl: './control.component.html'
})
export class ControlComponent {
  rules: DrainageRule[] = [
      {title: "Mittelstarker Regenfall", rainAmount: 5, rainDuration: 15, targetLevel: 40, drainageForerun: 10, open: signals.toggleable(true)},
      {title: "Starkregen", rainAmount: 15, rainDuration: 30, targetLevel: 20, drainageForerun: 30, open: signals.toggleable(false)},
    ];
}
