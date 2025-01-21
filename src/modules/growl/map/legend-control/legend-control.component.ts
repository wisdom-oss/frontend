import {signal, Component} from "@angular/core";

@Component({
  selector: "growl-legend-control",
  imports: [],
  templateUrl: "./legend-control.component.html",
  styles: ``,
})
export class LegendControlComponent {
  readonly legendItems = {
    "Höchstwert überschritten": "#00008B",
    "sehr hoch": "#104E8B",
    hoch: "#1E90FF",
    normal: "#00FF00",
    niedrig: "#FFFF00",
    "sehr niedrig": "#CD6839",
    "Niedrigstwert unterschritten": "#FF0000",
    null: "#888888",
  } as const;
  protected legendItemsIter = Object.entries(this.legendItems) as Iterable<
    [keyof LegendControlComponent["legendItems"], string]
  >;

  readonly count = signal<
    Record<keyof LegendControlComponent["legendItems"], number>
  >({
    "Höchstwert überschritten": 0,
    "sehr hoch": 0,
    hoch: 0,
    normal: 0,
    niedrig: 0,
    "sehr niedrig": 0,
    "Niedrigstwert unterschritten": 0,
    null: 0,
  });
}
