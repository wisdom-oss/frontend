import {model, output, Component} from "@angular/core";
import {provideIcons, NgIconComponent} from "@ng-icons/core";
import {
  remixLogoutBoxLine,
  remixMenu2Line,
  remixTranslate2,
} from "@ng-icons/remixicon";

import {IsActiveToggleDirective} from "../../common/directives/is-active-toggle.directive";
import {signals} from "../../common/signals";

@Component({
  selector: "navbar",
  standalone: true,
  imports: [NgIconComponent, IsActiveToggleDirective],
  templateUrl: "./navbar.component.html",
  styleUrl: "./navbar.component.scss",
  providers: [
    provideIcons({
      remixMenu2Line,
      remixLogoutBoxLine,
      remixTranslate2,
    }),
  ],
})
export class NavbarComponent {
  userDropdownActive = signals.toggleable(false);
  sidebarClick = output();
}
