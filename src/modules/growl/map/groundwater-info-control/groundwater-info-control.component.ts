import {input, Component} from "@angular/core";

@Component({
  selector: "growl-groundwater-info-control",
  imports: [],
  templateUrl: "./groundwater-info-control.component.html",
  styles: ``,
})
export class GroundwaterInfoControlComponent {
  readonly data = input<GroundwaterInfoControlComponent.Display>();
}

export namespace GroundwaterInfoControlComponent {
  export interface Display {
    name: string;
    key: string;
  }
}
