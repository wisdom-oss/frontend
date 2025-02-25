import {Routes} from "@angular/router";

import {CallbackComponent} from "./core/auth/callback/callback.component";
import {CoreComponent} from "./core/core.component";
import {permissionsGuard} from "./core/auth/permissions.guard";
import {GreeterComponent} from "./core/greeter/greeter.component";
import {GrowlComponent} from "./modules/growl/growl.component";

export const routes: Routes = [
  {path: "callback", component: CallbackComponent},
  {
    path: "",
    component: CoreComponent,
    children: [
      {path: "", component: GreeterComponent}, // Default child route
      {path: "growl", component: GrowlComponent},
      {
        path: "oowv/action-map",
        component: GreeterComponent,
        canActivate: [permissionsGuard("geodata:read")],
      },
    ],
  },
  {path: "**", redirectTo: ""}, // Wildcard fallback
];
