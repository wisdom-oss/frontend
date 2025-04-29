import {input, Component} from "@angular/core";
import {provideIcons, NgIconComponent} from "@ng-icons/core";
import {remixCalendarLine, remixResetLeftLine} from "@ng-icons/remixicon";

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
  readonly fullWidth = input(false);
  readonly flavor = input<"lean" | "bold">("bold");
}
