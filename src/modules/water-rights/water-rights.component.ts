import {Component} from "@angular/core";
import {RouterOutlet} from "@angular/router";

@Component({
  // required for ID generation of simple component
  selector: "wisdom-water-rights",
  imports: [RouterOutlet],
  template: "<router-outlet></router-outlet>",
})
export class WaterRightsComponent {}
