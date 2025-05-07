import {Component} from "@angular/core";

import {DateTimePickerComponent} from "../../common/components/date-time-picker/date-time-picker.component";
import {matrix} from "../../common/utils/matrix";

@Component({
  imports: [DateTimePickerComponent],
  templateUrl: "./playground.component.html",
})
export class PlaygroundComponent {
  protected layout = matrix({
    flavor: ["lean", "bold"],
    ranged: [false, true],
    fullWidth: [false, true],
    size: ["large", "medium", "small"],
  } as const);
}
