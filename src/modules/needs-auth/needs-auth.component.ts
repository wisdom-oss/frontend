import {Component} from "@angular/core";

import {Scopes} from "../../core/auth/scopes";

@Component({
  selector: "wisdom-needs-auth",
  imports: [],
  template: "<p>We're in!</p>",
  styles: ``,
})
export class NeedsAuthComponent {
  static readonly SCOPES: Scopes.Scope[] = ["needs-auth:read"];
}
