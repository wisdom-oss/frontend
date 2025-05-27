import {effect, inject, signal, Component} from "@angular/core";
import {provideIcons, NgIcon} from "@ng-icons/core";
import {remixExternalLinkFill, remixGithubFill} from "@ng-icons/remixicon";

import {GeoDataService} from "../../api/geo-data.service";

@Component({
  selector: "wisdom-greeter",
  imports: [NgIcon],
  templateUrl: "./greeter.component.html",
  styles: ``,
  providers: [
    provideIcons({
      remixGithubFill,
      remixExternalLinkFill,
    }),
  ],
})
export class GreeterComponent {
  private geo = inject(GeoDataService);

  private input = signal("lol");
  // private layer = this.geo.fetchLayerInformation(this.input);
  // private _layer = effect(() => console.log(this.layer()));

  constructor() {
    setTimeout(() => this.input.set("water_right_usage_locations"), 5000);
  }
}
