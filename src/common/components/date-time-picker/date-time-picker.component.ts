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
  readonly showPickerInput = input(false, {alias: "showPicker"});
  readonly showPicker = signals.toggleable(this.showPickerInput());

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

  protected selectStart = (date: Dayjs) =>
    this.selected.update(([_, end]) => [date, end]);
  protected selectEnd = (date: Dayjs) =>
    this.selected.update(([start, _]) => [start, date]);

  private orderSelected = effect(() => {
    let [start, end] = this.selected();
    if (!start || !end) return;
    if (end.isBefore(start)) this.selected.set([end, start]);
  });

  protected labelStart = computed(this.label(0));
  protected labelEnd = computed(this.label(1));
  private label(idx: number): () => string {
    return () => {
      let selectedDay = this.selected()[idx];
      let day = selectedDay ?? dayjs();
      let content = day.locale(this.lang()).format("L");
      if (selectedDay) return content;
      return content.replaceAll(this.matchDigits, "0");
    };
  }

  protected requested = signal<"start" | "end">("start");
  protected selectRequested(date: Dayjs) {
    switch (this.requested()) {
      case "start":
        return this.selected.update(([_, end]) => [date, end]);
      case "end":
        return this.selected.update(([start, _]) => [start, date]);
    }
  }

  private logSelected = effect(() => console.log(this.selected()));
  private logIsActive = effect(() => console.log(this.showPicker()));

  protected picker = signal<"date" | "year">("date");

  protected pickerMonthStart = signal<Dayjs>(
    (this.selected()[0] ?? dayjs()).startOf("month"),
  );
  protected pickerMonthEnd = computed(() =>
    this.pickerMonthStart().endOf("month"),
  );
  protected pickerDay = computed(() =>
    this.pickerMonthStart().startOf("isoWeek"),
  );

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

  private deriveIsActive = effect(() =>
    this.showPicker.set(this.showPickerInput()),
  );
  private emitOutput = effect(() => this.selectedOutput.emit(this.selected()));

  protected previousMonth() {
    this.pickerMonthStart.update(day => day.subtract(1, "month"));
  }

  protected nextMonth() {
    this.pickerMonthStart.update(day => day.add(1, "month"));
  }
}
