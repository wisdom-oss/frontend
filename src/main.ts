import {Component} from "@angular/core";
import {bootstrapApplication} from "@angular/platform-browser";
import {RouterOutlet} from "@angular/router";
import {TranslateService} from "@ngx-translate/core";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";

import {wisdomAppConfig} from "./config";
import {configureTranslations} from "./i18n";

@Component({
  selector: "app",
  imports: [RouterOutlet],
  template: "<router-outlet></router-outlet>",
})
class AppComponent {
  constructor(private translate: TranslateService) {
    dayjs.extend(duration);
    configureTranslations(translate);
  }
}

bootstrapApplication(AppComponent, wisdomAppConfig).catch(err =>
  console.error(err),
);
