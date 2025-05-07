import {effect, input, signal, Component, output} from "@angular/core";
import {provideIcons, NgIconComponent} from "@ng-icons/core";
import {remixCalendarLine, remixResetLeftLine} from "@ng-icons/remixicon";
import {Dayjs} from "dayjs";

import {signals} from "../../signals";
import { range } from "../../utils/range";

@Component({
  selector: "date-time",
  imports: [NgIconComponent],
  templateUrl: "./date-time-picker.component.html",
  providers: [
    provideIcons({
      remixCalendarLine,
      remixResetLeftLine,
    }),
  ],
})
export class DateTimePickerComponent {
  readonly ranged = input(false);
  readonly mode = input<"date" | "week" | "datetime" | "time">("date");
  readonly fullWidth = input(false);
  readonly flavor = input<"lean" | "bold">("bold");
  readonly size = input<"small" | "medium" | "large">("large");
  readonly collapsedInput = input(true, {alias: "collapsed"});
  protected collapsed = signals.toggleable(this.collapsedInput());

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

  protected selected = signal<[Dayjs | undefined, Dayjs | undefined]>(this.placeholder());
  readonly selectedOutput = output<[Dayjs | undefined, Dayjs | undefined]>({alias: "selected"});

  protected util = {range};

  constructor() {
    effect(() => this.collapsed.set(this.collapsedInput()));
    effect(() => this.selectedOutput.emit(this.selected()));
  }
}
