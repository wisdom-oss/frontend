import {signal, Component} from "@angular/core";
import {TranslatePipe} from "@ngx-translate/core";

import {GroundwaterLevelsService} from "../../../../api/groundwater-levels.service";
import nlwknMeasurementClassificationColors from "../../../../assets/nlwkn-measurement-classification-colors.toml";

// alias the enum here to ease the use of it
type MC = GroundwaterLevelsService.MeasurementClassification;
const MC = GroundwaterLevelsService.MeasurementClassification;

@Component({
  selector: "growl-legend-control",
  imports: [TranslatePipe],
  templateUrl: "./legend-control.component.html",
  styles: ``,
})
export class LegendControlComponent {
  protected legendColors: Record<MC | "null", string> =
    nlwknMeasurementClassificationColors;

  protected legendItemsIter = [...Object.values(MC), "null"] as Iterable<
    MC | "null"
  >;

  readonly count = signal<Record<MC | "null", number>>({
    [MC.MAX_EXCEEDED]: 0,
    [MC.VERY_HIGH]: 0,
    [MC.HIGH]: 0,
    [MC.NORMAL]: 0,
    [MC.LOW]: 0,
    [MC.VERY_LOW]: 0,
    [MC.MIN_UNDERSHOT]: 0,
    null: 0,
  });
}
