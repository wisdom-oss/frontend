import {Routes} from "@angular/router";

import {CallbackComponent} from "./core/auth/callback/callback.component";
import {CoreComponent} from "./core/core.component";
import {permissionsGuard} from "./core/auth/permissions.guard";
import {GreeterComponent} from "./core/greeter/greeter.component";
import {BeWaterSmartComponent} from "./modules/be-water-smart/be-water-smart.component";
import {GrowlComponent} from "./modules/growl/growl.component";
import {OowvActionMapComponent} from "./modules/oowv/action-map/action-map.component";

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
        path: "oowv/action-map",
        component: OowvActionMapComponent,
        canActivate: [permissionsGuard(...OowvActionMapComponent.SCOPES)],
      },
    ],
  },
  {path: "**", redirectTo: ""}, // Wildcard fallback
];
