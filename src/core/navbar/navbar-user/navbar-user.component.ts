import {NgIf} from "@angular/common";
import {computed, Component, signal, Signal, WritableSignal, effect} from "@angular/core";
import {provideIcons, NgIconComponent} from "@ng-icons/core";
import {remixLoginBoxLine, remixLogoutBoxLine, remixRotateLockFill} from "@ng-icons/remixicon";
import { image as gravatar } from "gravatar-gen";
import {signals} from "../../../common/signals";
import {AuthService} from "../../auth/auth.service";
import {UserService} from "../../user.service";
import { StorageService } from "../../../common/storage.service";

const REMEMBER_LOGIN_KEY = "remember";

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
      remixRotateLockFill,
    }),
  ],
})
export class NavbarUserComponent {
  private storage: StorageService.Storages;

  readonly rememberLogin: WritableSignal<boolean>;
  readonly userDropdownActive = signals.toggleable(false);

  readonly loggedIn = computed(() => !!this.authService.accessToken());
  readonly userDetails = computed(() => this.userService.userDetails());
  readonly userAvatar = signal("none");

  constructor(
    readonly authService: AuthService,
    readonly userService: UserService,
    storage: StorageService,
  ) {
    if (this.authService.accessToken()) {
      this.userService.fetchUserDetails();
    }

    this.storage = storage.instance(NavbarUserComponent);
    let remember = this.storage.local.get(REMEMBER_LOGIN_KEY) ?? "true";
    this.rememberLogin = signal(JSON.parse(remember));

    effect(async () => {
      let userDetails = this.userService.userDetails();
      if (!userDetails) return this.userAvatar.set("none");
      let url = await gravatar(userDetails.email, {defaultImage: "identicon"});
      this.userAvatar.set(`url("${url}")`);
    }, {allowSignalWrites: true});
  }

  toggleRemember() {
    let remember = !this.rememberLogin();
    this.rememberLogin.set(remember);
    this.storage.local.set(REMEMBER_LOGIN_KEY, JSON.stringify(remember));
  }
}
