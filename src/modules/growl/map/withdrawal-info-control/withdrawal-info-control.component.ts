import {DecimalPipe} from "@angular/common";
import {computed, input, Component, Signal} from "@angular/core";

import {WaterRightsService} from "../../../../api/water-rights.service";
import {signals} from "../../../../common/signals";

@Component({
  selector: "growl-withdrawal-info-control",
  imports: [DecimalPipe],
  templateUrl: "./withdrawal-info-control.component.html",
  styles: ``,
})
export class WithdrawalInfoControlComponent {
  readonly in = input.required<{
    name: string;
    key: string;
    withdrawals: Signal<WaterRightsService.AverageWithdrawals | null>;
  }>();

  protected lang = signals.lang();

  protected value = computed(() => {
    let input = this.in();
    if (!input) return null;
    let withdrawal = input.withdrawals();
    if (!withdrawal) return null;
    return Math.floor(withdrawal.minimalWithdrawal);
  });
}
