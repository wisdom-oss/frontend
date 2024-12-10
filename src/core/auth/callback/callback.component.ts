import {Component, OnInit} from "@angular/core";
import {ActivatedRoute, Router} from "@angular/router";

import {AuthService} from "../auth.service";

@Component({
    selector: "wisdom-callback",
    imports: [],
    templateUrl: "./callback.component.html",
    styles: ``
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
