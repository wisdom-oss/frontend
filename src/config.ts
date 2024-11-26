import {
  provideHttpClient,
  withInterceptors,
  withInterceptorsFromDi,
  HTTP_INTERCEPTORS,
} from "@angular/common/http";
import {provideZoneChangeDetection, ApplicationConfig} from "@angular/core";
import {provideRouter} from "@angular/router";
import {provideCharts, withDefaultRegisterables} from "ng2-charts";

import {routes} from "./routes";
import {SchemaValidationInterceptor} from "./core/schema-validation.interceptor";
import {apiInterceptor} from "./core/api.interceptor";
import { authInterceptor } from "./core/auth/auth.interceptor";

export const wisdomAppConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({eventCoalescing: true}),
    provideRouter(routes),
    provideCharts(withDefaultRegisterables()),
    provideHttpClient(
      withInterceptors([apiInterceptor, authInterceptor]),
      withInterceptorsFromDi(),
    ),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: SchemaValidationInterceptor,
      multi: true,
    },
  ],
};
