import {Routes} from "@angular/router";

import {CallbackComponent} from "./core/auth/callback/callback.component";
import {CoreComponent} from "./core/core.component";

export const routes: Routes = [
  {path: "callback", component: CallbackComponent},
  {path: "**", component: CoreComponent, children: []},
];
