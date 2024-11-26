import {NgIf} from "@angular/common";
import {computed, Component} from "@angular/core";
import {provideIcons, NgIconComponent} from "@ng-icons/core";
import {remixLoginBoxLine, remixLogoutBoxLine} from "@ng-icons/remixicon";

import {signals} from "../../../common/signals";
import {AuthService} from "../../auth/auth.service";
import {UserService} from "../../user.service";

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
  loggedIn = computed(() => !!this.authService.accessToken());
  userDetails = computed(() => this.userService.userDetails());

  constructor(
    readonly authService: AuthService,
    readonly userService: UserService,
  ) {
    if (this.authService.accessToken()) {
      this.userService.fetchUserDetails();
    }
  }
}
