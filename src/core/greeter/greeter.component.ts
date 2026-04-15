import {Component} from "@angular/core";
import {provideIcons, NgIcon} from "@ng-icons/core";
import {remixExternalLinkFill, remixGithubFill} from "@ng-icons/remixicon";

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
