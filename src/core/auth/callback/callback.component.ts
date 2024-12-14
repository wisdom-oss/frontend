import {Component, OnInit} from "@angular/core";
import {RouterLink, ActivatedRoute, Router} from "@angular/router";
import {provideIcons, NgIcon} from "@ng-icons/core";
import {
  remixArrowGoBackFill,
  remixHome2Fill,
  remixMagicFill,
  remixSparkling2Fill,
} from "@ng-icons/remixicon";
import {TranslateDirective} from "@ngx-translate/core";

import {AuthService} from "../auth.service";

@Component({
  selector: "wisdom-callback",
  imports: [NgIcon, RouterLink, TranslateDirective],
  templateUrl: "./callback.component.html",
  styles: ``,
  providers: [
    provideIcons({
      remixMagicFill,
      remixSparkling2Fill,
      remixHome2Fill,
      remixArrowGoBackFill,
    }),
  ],
})
export class CallbackComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
  ) {}

  async ngOnInit(): Promise<void> {
    let queryParams = this.route.snapshot.queryParams;
    let code = queryParams["code"];
    let state = queryParams["state"];

    // TODO: make this good errors
    if (!code) throw new Error("code is missing");
    if (typeof code != "string") throw new Error("expected code as string");
    if (!state) throw new Error("state is missing");
    if (typeof state != "string") throw new Error("expected state as string");

    let redirect = await this.authService.callback(code, state);
    if (redirect) this.router.navigateByUrl(redirect);
    this.router.navigateByUrl("/");
  }
}
