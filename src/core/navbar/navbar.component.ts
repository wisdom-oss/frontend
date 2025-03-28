import {output, Component} from "@angular/core";
import {RouterLink} from "@angular/router";
import {provideIcons, NgIconComponent} from "@ng-icons/core";
import {remixMenu2Line, remixTranslate2} from "@ng-icons/remixicon";
import {TranslateDirective, TranslateService} from "@ngx-translate/core";

import {NavbarUserComponent} from "./navbar-user/navbar-user.component";
import {IsActiveToggleDirective} from "../../common/directives/is-active-toggle.directive";
import {IsAutoHideDirective} from "../../common/directives/is-auto-hide.directive";
import {signals} from "../../common/signals";

@Component({
  selector: "navbar",
  imports: [
    NgIconComponent,
    IsActiveToggleDirective,
    NavbarUserComponent,
    RouterLink,
    IsAutoHideDirective,
    TranslateDirective,
  ],
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
  readonly sidebarClick = output();
  readonly langSelectActive = signals.toggleable(false);

  constructor(protected translate: TranslateService) {}
}
