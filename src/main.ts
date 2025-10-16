import "./global";

import {registerLocaleData} from "@angular/common";
import localeDe from "@angular/common/locales/de";
import localeDeExtra from "@angular/common/locales/extra/de";
import {Component} from "@angular/core";
import {bootstrapApplication} from "@angular/platform-browser";
import {RouterOutlet} from "@angular/router";
import {TranslateService} from "@ngx-translate/core";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import isoWeek from "dayjs/plugin/isoWeek";
import localizedFormat from "dayjs/plugin/localizedFormat";
import relativeTime from "dayjs/plugin/relativeTime";

import {StorageService} from "./common/storage.service";
import durationExt from "./core/dayjs/duration-ext.plugin";
import {wisdomAppConfig} from "./config";
import {configureTranslations} from "./i18n";

import "dayjs/locale/de";

@Component({
  selector: "app",
  imports: [RouterOutlet],
  template: "<router-outlet></router-outlet>",
})
export class AppComponent {
  constructor(translate: TranslateService, storage: StorageService) {
    dayjs.extend(duration);
    dayjs.extend(isoWeek);
    dayjs.extend(localizedFormat);
    dayjs.extend(relativeTime);
    dayjs.extend(durationExt);
    configureTranslations(translate, storage);
    translate.onLangChange.subscribe(({lang}) => dayjs.locale(lang));
    registerLocaleData(localeDe, "de", localeDeExtra);
  }
}

bootstrapApplication(AppComponent, wisdomAppConfig).catch(err =>
  console.error(err),
);
