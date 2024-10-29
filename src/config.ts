import {provideZoneChangeDetection, ApplicationConfig} from "@angular/core";
import {provideRouter} from "@angular/router";
import {provideCharts, withDefaultRegisterables} from "ng2-charts";

import {routes} from "./routes";

export const wisdomAppConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({eventCoalescing: true}),
    provideRouter(routes),
    provideCharts(withDefaultRegisterables()),
  ],
};
