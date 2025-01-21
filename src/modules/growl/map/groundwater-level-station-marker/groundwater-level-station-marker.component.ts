import {
  effect,
  input,
  signal,
  Component,
  AfterViewInit,
  ElementRef,
  Renderer2,
} from "@angular/core";

@Component({
  selector: "growl-groundwater-level-station-marker",
  imports: [],
  templateUrl: "./groundwater-level-station-marker.component.svg",
  styles: ``,
})
export class GroundwaterLevelStationMarkerComponent implements AfterViewInit {
  private svg = signal<SVGElement | undefined>(undefined);
  private filler = signal<SVGPathElement | undefined>(undefined);
  private backgroundFiller = signal<SVGPathElement | undefined>(undefined);

  readonly size = input("40px");
  readonly color = input<string | undefined>(undefined);
  readonly backgroundColor = input<string | undefined>(undefined);

  constructor(
    private host: ElementRef,
    private renderer: Renderer2,
  ) {
    effect(() => {
      let svg = this.svg();
      if (!svg) return;

      let size = this.size();
      this.renderer.setStyle(svg, "height", size);
      this.renderer.setStyle(svg, "width", size);
    });

    effect(() => {
      let filler = this.filler();
      if (!filler) return;

      let color = this.color();
      this.renderer.setStyle(filler, "fill", color);
    });

    effect(() => {
      let backgroundFiller = this.backgroundFiller();
      if (!backgroundFiller) return;

      let backgroundColor = this.backgroundColor();
      this.renderer.setStyle(backgroundFiller, "fill", backgroundColor);
    });
  }

  ngAfterViewInit(): void {
    let native = this.host.nativeElement;
    this.svg.set(native.querySelector("svg"));
    this.filler.set(native.querySelector("#filler"));
    this.backgroundFiller.set(native.querySelector("#background-filler rect"));
  }
}
