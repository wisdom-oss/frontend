import {signal, Component} from "@angular/core";
import {provideIcons, NgIconComponent} from "@ng-icons/core";
import {
  remixLogoutBoxLine,
  remixMenu2Line,
  remixTranslate2,
} from "@ng-icons/remixicon";

import {IsActiveToggleDirective} from "../common/directives/is-active-toggle.directive";
import {signals} from "../common/signals";

@Component({
  selector: "wisdom-core",
  standalone: true,
  imports: [NgIconComponent, IsActiveToggleDirective],
  templateUrl: "./core.component.html",
  styleUrl: "./core.component.scss",
  providers: [
    provideIcons({
      remixMenu2Line,
      remixLogoutBoxLine,
      remixTranslate2,
    }),
  ],
})
export class CoreComponent {
  userDropdownActive = signals.toggleable(false);
}
