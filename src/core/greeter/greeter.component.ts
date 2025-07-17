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
export class GreeterComponent {}
