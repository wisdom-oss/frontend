import {NgIf} from "@angular/common";
import {signal, Component} from "@angular/core";
import {provideIcons, NgIconComponent} from "@ng-icons/core";
import {remixLoginBoxLine, remixLogoutBoxLine} from "@ng-icons/remixicon";

import {signals} from "../../../common/signals";
import {AuthService} from "../../auth/auth.service";

@Component({
  selector: "navbar-user",
  standalone: true,
  imports: [NgIconComponent, NgIf],
  templateUrl: "./navbar-user.component.html",
  styleUrl: "./navbar-user.component.scss",
  providers: [
    provideIcons({
      remixLogoutBoxLine,
      remixLoginBoxLine,
    }),
  ],
})
export class NavbarUserComponent {
  userDropdownActive = signals.toggleable(false);
  loggedIn = signal(false);

  constructor(readonly authService: AuthService) {}
}
