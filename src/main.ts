import {registerLocaleData, DOCUMENT} from "@angular/common";
import localeDe from "@angular/common/locales/de";
import localeDeExtra from "@angular/common/locales/extra/de";
import {inject, Component} from "@angular/core";
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
export class AppComponent {
  private document = inject(DOCUMENT);

  constructor(translate: TranslateService) {
    dayjs.extend(duration);
    configureTranslations(translate);
    registerLocaleData(localeDe, "de", localeDeExtra);
  }
}

bootstrapApplication(AppComponent, wisdomAppConfig).catch(err =>
  console.error(err),
);
