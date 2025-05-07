import {
  computed,
  effect,
  input,
  output,
  signal,
  Component,
} from "@angular/core";
import {provideIcons, NgIconComponent} from "@ng-icons/core";
import {
  remixArrowDownSFill,
  remixArrowUpSFill,
  remixCalendarLine,
  remixResetLeftLine,
} from "@ng-icons/remixicon";
import {TranslateDirective} from "@ngx-translate/core";
import dayjs, {Dayjs} from "dayjs";

import {signals} from "../../signals";
import {IsAutoHideDirective} from "../../directives/is-auto-hide.directive";
import {range} from "../../utils/range";

@Component({
  selector: "date-time",
  imports: [NgIconComponent, TranslateDirective, IsAutoHideDirective],
  templateUrl: "./date-time-picker.component.html",
  styleUrl: "./date-time-picker.component.scss",
  providers: [
    provideIcons({
      remixCalendarLine,
      remixResetLeftLine,
      remixArrowUpSFill,
      remixArrowDownSFill,
    }),
  ],
})
export class DateTimePickerComponent {
  readonly ranged = input(false);
  readonly mode = input<"date" | "week" | "datetime" | "time">("date");
  readonly fullWidth = input(false);
  readonly flavor = input<"lean" | "bold">("bold");
  readonly size = input<"small" | "medium" | "large">("large");
  readonly isActiveInput = input(false, {alias: "isActive"});
  readonly isActive = signals.toggleable(this.isActiveInput());

  readonly placeholder = input<
    [undefined, undefined] | [Dayjs, undefined] | [Dayjs, Dayjs],
    undefined | Dayjs | [Dayjs, Dayjs]
  >([undefined, undefined], {
    transform: input => {
      if (!input) return [undefined, undefined];
      if (Array.isArray(input)) return input;
      return [input, undefined];
    },
  });

  protected selected = signal<[Dayjs | undefined, Dayjs | undefined]>(
    this.placeholder(),
  );
  readonly selectedOutput = output<[Dayjs | undefined, Dayjs | undefined]>({
    alias: "selected",
  });

  protected viewMonthStart = signal<Dayjs>(
    (this.selected()[0] ?? dayjs()).startOf("month"),
  );
  protected viewMonthEnd = computed(() => this.viewMonthStart().endOf("month"));
  protected viewDay = computed(() => this.viewMonthStart().startOf("isoWeek"));

  protected util = {range, dayjs};
  protected lang = signals.lang();
  protected matchDigits = /\d/g;
  protected days = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  constructor() {
    effect(() => this.isActive.set(this.isActiveInput()));
    effect(() => this.selectedOutput.emit(this.selected()));

    console.log(this.viewDay());
  }

  protected previousMonth() {
    this.viewMonthStart.update(day => day.subtract(1, "month"));
  }

  protected nextMonth() {
    this.viewMonthStart.update(day => day.add(1, "month"));
  }
}
