import {Component} from "@angular/core";
import { matrix } from "../../common/utils/matrix";
import {DateTimePickerComponent} from "../../common/components/date-time-picker/date-time-picker.component";

@Component({
  imports: [DateTimePickerComponent],
  templateUrl: "./playground.component.html",
})
export class PlaygroundComponent {
  protected layout = matrix({
    flavor: ["lean", "bold"],
    ranged: [false, true],
    fullWidth: [false, true],
  } as const);
}
