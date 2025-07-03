import {DecimalPipe} from "@angular/common";
import {computed, input, Component} from "@angular/core";

import {WaterRightsService} from "../../../../api/water-rights.service";
import {signals} from "../../../../common/signals";

@Component({
  selector: "growl-withdrawal-info-control",
  imports: [DecimalPipe],
  templateUrl: "./withdrawal-info-control.component.html",
  styles: ``,
})
export class WithdrawalInfoControlComponent {
  readonly data = input.required<{
    name: string;
    key: string;
    withdrawals: WaterRightsService.AverageWithdrawals | null;
  }>();

  protected lang = signals.lang();

  protected value = computed(() => {
    let input = this.data();
    if (!input) return null;
    let withdrawal = input.withdrawals;
    if (!withdrawal) return null;
    return Math.floor(withdrawal.minimalWithdrawal);
  });
}
