import {
  provideHttpClient,
  withInterceptors,
  withInterceptorsFromDi,
} from "@angular/common/http";
import {provideZoneChangeDetection, ApplicationConfig} from "@angular/core";
import {provideRouter} from "@angular/router";
import {provideTranslateService} from "@ngx-translate/core";
import {provideCharts, withDefaultRegisterables} from "ng2-charts";

import {routes} from "./routes";
import {apiInterceptor} from "./core/api.interceptor";
import {authInterceptor} from "./core/auth/auth.interceptor";
import {errorInterceptor} from "./core/error.interceptor";
import {cacheInterceptor} from "./core/cache/cache.interceptor";
import {provideLangSignal} from "./core/providers/lang-signal.provider";
import {provideMaplibreSettings} from "./core/providers/maplibre-settings.provider";
import {validateTypeInterceptor} from "./core/validate-type.interceptor";

export const wisdomAppConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({eventCoalescing: true}),
    provideRouter(routes),
    provideCharts(withDefaultRegisterables()),
    provideTranslateService(),
    provideLangSignal(),
    provideMaplibreSettings(),
    provideHttpClient(
      withInterceptors([cacheInterceptor, apiInterceptor, authInterceptor]),
      withInterceptorsFromDi(),
      withInterceptors([errorInterceptor, validateTypeInterceptor]),
    ),
  ],
};
