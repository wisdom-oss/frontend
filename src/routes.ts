import {Routes} from "@angular/router";

import {CallbackComponent} from "./core/auth/callback/callback.component";
import {CoreComponent} from "./core/core.component";
import {GreeterComponent} from "./core/greeter/greeter.component";
import { WaterDemandPredictionComponent } from "./modules/water-demand-prediction/water-demand-prediction.component";

export const routes: Routes = [
  { path: "callback", component: CallbackComponent },
  { path: "", component: CoreComponent, children: [
      { path: "", component: GreeterComponent }, // Default child route
      { path: "water-demand-prediction", component: WaterDemandPredictionComponent }, // Default child route

    ] 
  },
  { path: "**", redirectTo: "" }, // Wildcard fallback
];
