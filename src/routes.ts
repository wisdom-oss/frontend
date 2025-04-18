import {Routes} from "@angular/router";

import {CallbackComponent} from "./core/auth/callback/callback.component";
import {CoreComponent} from "./core/core.component";
import {permissionsGuard} from "./core/auth/permissions.guard";
import {GreeterComponent} from "./core/greeter/greeter.component";
import {BeWaterSmartComponent} from "./modules/be-water-smart/be-water-smart.component";
import {GrowlComponent} from "./modules/growl/growl.component";
import {LongTermForecastComponent} from "./modules/long-term-forecast/long-term-forecast.component";
import {longTermForecastRoutes} from "./modules/long-term-forecast/routes";
import {OowvActionMapComponent} from "./modules/oowv/action-map/action-map.component";
import {PumpModelsComponent} from "./modules/pump-models/pump-models.component";

export const routes: Routes = [
  {path: "callback", component: CallbackComponent},
  {
    path: "",
    component: CoreComponent,
    children: [
      {path: "", component: GreeterComponent}, // Default child route
      {path: "be-water-smart", component: BeWaterSmartComponent},
      {path: "growl", component: GrowlComponent},
      {
        path: "long-term-forecast",
        component: LongTermForecastComponent,
        children: longTermForecastRoutes,
      },
      {
        path: "pump-models",
        component: PumpModelsComponent,
        canActivate: [permissionsGuard(...PumpModelsComponent.SCOPES)],
      },
      {
        path: "oowv/action-map",
        component: OowvActionMapComponent,
        canActivate: [permissionsGuard(...OowvActionMapComponent.SCOPES)],
      },
    ],
  },
  {path: "**", redirectTo: ""}, // Wildcard fallback
];
