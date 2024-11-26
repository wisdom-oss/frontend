import {output, Component} from "@angular/core";
import {provideIcons, NgIconComponent} from "@ng-icons/core";
import {remixMenu2Line, remixTranslate2} from "@ng-icons/remixicon";

import {NavbarUserComponent} from "./navbar-user/navbar-user.component";
import {IsActiveToggleDirective} from "../../common/directives/is-active-toggle.directive";

@Component({
  selector: "navbar",
  standalone: true,
  imports: [NgIconComponent, IsActiveToggleDirective, NavbarUserComponent],
  templateUrl: "./navbar.component.html",
  styleUrl: "./navbar.component.scss",
  providers: [
    provideIcons({
      remixMenu2Line,
      remixTranslate2,
    }),
  ],
})
export class NavbarComponent {
  sidebarClick = output();
}
