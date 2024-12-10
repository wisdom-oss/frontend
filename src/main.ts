import {Component} from "@angular/core";
import {bootstrapApplication} from "@angular/platform-browser";
import {RouterOutlet} from "@angular/router";

import {wisdomAppConfig} from "./config";

@Component({
  selector: "app",
  imports: [RouterOutlet],
  template: "<router-outlet></router-outlet>",
})
class AppComponent {}

bootstrapApplication(AppComponent, wisdomAppConfig).catch(err =>
  console.error(err),
);
