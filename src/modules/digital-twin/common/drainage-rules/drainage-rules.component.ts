import {model, signal, Component, WritableSignal} from "@angular/core";
import {provideIcons, NgIconComponent} from "@ng-icons/core";
import {
  remixArrowDownSLine,
  remixArrowUpSLine,
  remixBookMarkedLine,
  remixContrastDrop2Line,
  remixDeleteBin6Line,
  remixEditLine,
  remixHistoryLine,
  remixRainyLine,
  remixTimeLine,
} from "@ng-icons/remixicon";
import {TranslateDirective} from "@ngx-translate/core";

import {signals} from "../../../../common/signals";

export type DrainageRule = {
  title: string;
  rainAmount: number;
  rainDuration: number;
  targetLevel: number;
  drainageForerun: number;
  open: signals.ToggleableSignal;
};

@Component({
  selector: "drainage-rules",
  imports: [TranslateDirective, NgIconComponent],
  templateUrl: "./drainage-rules.component.html",
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
  drainageRules = model.required<DrainageRule[]>();

  protected newDrainageRule: DrainageRule = {
    title: "",
    rainAmount: 0,
    rainDuration: 0,
    targetLevel: 0,
    drainageForerun: 0,
    open: signals.toggleable(true),
  };
  protected drainageRuleModal: WritableSignal<DrainageRule> = signal(
    this.newDrainageRule,
  );
  protected drainageRuleModalIndex = signals.maybe<number>();
  protected drainageRulesModalOpen: signals.ToggleableSignal =
    signals.toggleable(false);

  copyDrainageRule(index: number) {
    this.drainageRuleModal.set(this.drainageRules()[index]);
  }

  deleteDrainageRule(index: number) {
    this.drainageRules.set(this.drainageRules().filter((_, i) => index !== i));
  }

  updateDrainageRules() {
    if (this.drainageRuleModalIndex() === undefined) {
      const rules = this.drainageRules().concat(this.drainageRuleModal());
      this.drainageRules.set(rules);
    } else {
      this.drainageRules.set(
        this.drainageRules().map((item, i) =>
          i === this.drainageRuleModalIndex() ? this.drainageRuleModal() : item,
        ),
      );
    }
  }

  updateDrainageRuleTitle(value: string) {
    this.drainageRuleModal.set({...this.drainageRuleModal(), title: value});
  }

  updateDrainageRule(attribute: string, value: number) {
    switch (attribute) {
      case "rainAmount":
        this.drainageRuleModal.set({
          ...this.drainageRuleModal(),
          rainAmount: value,
        });
        break;
      case "rainDuration":
        this.drainageRuleModal.set({
          ...this.drainageRuleModal(),
          rainDuration: value,
        });
        break;
      case "targetLevel":
        this.drainageRuleModal.set({
          ...this.drainageRuleModal(),
          targetLevel: value,
        });
        break;
      case "drainageForerun":
        this.drainageRuleModal.set({
          ...this.drainageRuleModal(),
          drainageForerun: value,
        });
        break;
    }
  }
}
