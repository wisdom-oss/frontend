import {
  effect,
  input,
  signal,
  ViewChild,
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
  readonly size = input("40px");

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
  }

  ngAfterViewInit(): void {
    this.svg.set(this.host.nativeElement.querySelector("svg"));
  }
}
