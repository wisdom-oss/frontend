import {Routes} from "@angular/router";

import {CallbackComponent} from "./core/auth/callback/callback.component";
import {CoreComponent} from "./core/core.component";
import {GreeterComponent} from "./core/greeter/greeter.component";
import {BeWaterSmartComponent} from "./modules/be-water-smart/be-water-smart.component";

export const routes: Routes = [
  {path: "callback", component: CallbackComponent},
  {
    path: "",
    component: CoreComponent,
    children: [
      {path: "", component: GreeterComponent}, // Default child route
      {path: "be-water-smart", component: BeWaterSmartComponent},
    ],
  },
  {path: "**", redirectTo: ""}, // Wildcard fallback
];
