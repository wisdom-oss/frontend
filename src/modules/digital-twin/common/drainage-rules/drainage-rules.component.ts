import { Component, Input, signal, WritableSignal } from '@angular/core';
import { signals } from '../../../../common/signals';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { 
  remixContrastDrop2Line,
  remixRainyLine,
  remixArrowUpSLine,
  remixArrowDownSLine,
  remixTimeLine,
  remixHistoryLine,
  remixEditLine,
  remixDeleteBin6Line,
  remixBookMarkedLine
} from '@ng-icons/remixicon';
import { TranslateDirective } from '@ngx-translate/core';

export type DrainageRule = {
  title: string,
  rainAmount: number,
  rainDuration: number,
  targetLevel: number,
  drainageForerun: number,
  open: signals.ToggleableSignal,
}

@Component({
  selector: 'drainage-rules',
  imports: [
    TranslateDirective,
    NgIconComponent
  ],
  templateUrl: './drainage-rules.component.html',
  providers: [
    provideIcons({
      remixContrastDrop2Line,
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
export class DrainageRulesComponent {
  @Input() rules: DrainageRule[] = [
      {title: "Mittelstarker Regenfall", rainAmount: 5, rainDuration: 15, targetLevel: 40, drainageForerun: 10, open: signals.toggleable(true)},
      {title: "Starkregen", rainAmount: 15, rainDuration: 30, targetLevel: 20, drainageForerun: 30, open: signals.toggleable(false)},
  ];

  protected drainageRules: WritableSignal<DrainageRule[]>= signal(this.rules);
  protected newDrainageRule: DrainageRule = {title: "", rainAmount: 0, rainDuration: 0, targetLevel: 0, drainageForerun: 0, open: signals.toggleable(true)}
  protected drainageRuleModal: WritableSignal<DrainageRule>= signal(this.newDrainageRule);
  protected drainageRuleModalIndex: WritableSignal<number|undefined> = signal(undefined);
  protected drainageRulesModalOpen: signals.ToggleableSignal = signals.toggleable(false);

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
}
