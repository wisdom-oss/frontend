import {signal, Component} from "@angular/core";
import {TranslatePipe} from "@ngx-translate/core";

import {GeoDataService} from "../../../../api/geo-data.service";
import {GroundwaterLevelsService} from "../../../../api/groundwater-levels.service";

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
  // expose the class itself to the template
  protected This = LegendControlComponent;

  static readonly legendColors: Record<MC | "null", string> = {
    [MC.MAX_EXCEEDED]: "#00008B",
    [MC.VERY_HIGH]: "#104E8B",
    [MC.HIGH]: "#1E90FF",
    [MC.NORMAL]: "#00FF00",
    [MC.LOW]: "#FFFF00",
    [MC.VERY_LOW]: "#CD6839",
    [MC.MIN_UNDERSHOT]: "#FF0000",
    null: "#888888",
  } as const;

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
