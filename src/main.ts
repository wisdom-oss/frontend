import {Component} from "@angular/core";
import {bootstrapApplication} from "@angular/platform-browser";
import {RouterOutlet} from "@angular/router";
import {TranslateService} from "@ngx-translate/core";

import {wisdomAppConfig} from "./config";
import {configureTranslations} from "./i18n";

@Component({
  selector: "app",
  imports: [RouterOutlet],
  template: "<router-outlet></router-outlet>",
})
class AppComponent {
  constructor(private translate: TranslateService) {
    configureTranslations(translate);
  }
}

bootstrapApplication(AppComponent, wisdomAppConfig).catch(err =>
  console.error(err),
);
