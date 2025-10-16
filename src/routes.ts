import {Routes} from "@angular/router";

import {CallbackComponent} from "./core/auth/callback/callback.component";
import {CoreComponent} from "./core/core.component";
import {permissionsGuard} from "./core/auth/permissions.guard";
import {GreeterComponent} from "./core/greeter/greeter.component";
import {PlaygroundComponent} from "./core/playground/playground.component";
import {BeWaterSmartComponent} from "./modules/be-water-smart/be-water-smart.component";
import {GrowlComponent} from "./modules/growl/growl.component";
import {longTermForecastRoutes} from "./modules/long-term-forecast/routes";
import {OowvActionMapComponent} from "./modules/oowv/action-map/action-map.component";
import {PumpModelsComponent} from "./modules/pump-models/pump-models.component";
import {WaterRightsComponent} from "./modules/water-rights/water-rights.component";
import {waterRightsRoutes} from "./modules/water-rights/routes";
import {WeatherDataComponent} from "./modules/weather-data/weather-data.component";

export const routes: Routes = [
  {path: "callback", component: CallbackComponent},
  {
    path: "",
    component: CoreComponent,
    children: [
      {path: "", component: GreeterComponent}, // Default child route
      {path: "weather-data", component: WeatherDataComponent},
      {path: "be-water-smart", component: BeWaterSmartComponent},
      {path: "growl", component: GrowlComponent},
      {
        path: "water-rights",
        component: WaterRightsComponent,
        children: waterRightsRoutes,
      },
      {
        path: "long-term-forecast",
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
      {path: "playground", component: PlaygroundComponent},
    ],
  },
  {path: "**", redirectTo: ""}, // Wildcard fallback
];
