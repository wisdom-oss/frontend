import {
  provideHttpClient,
  withInterceptorsFromDi,
  HTTP_INTERCEPTORS,
} from "@angular/common/http";
import {provideZoneChangeDetection, ApplicationConfig} from "@angular/core";
import {provideRouter} from "@angular/router";
import {provideCharts, withDefaultRegisterables} from "ng2-charts";

import {routes} from "./routes";
import {SchemaValidationInterceptor} from "./core/schema-validation.interceptor";

export const wisdomAppConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({eventCoalescing: true}),
    provideRouter(routes),
    provideCharts(withDefaultRegisterables()),
    provideHttpClient(withInterceptorsFromDi()),
    {provide: HTTP_INTERCEPTORS, useClass: SchemaValidationInterceptor},
  ],
};
