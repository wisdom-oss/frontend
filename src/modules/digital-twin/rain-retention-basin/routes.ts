import {inject} from "@angular/core";
import {
  RedirectCommand,
  CanActivateFn,
  Router,
  Routes,
  UrlTree,
} from "@angular/router";

import {ControlComponent} from "./tabs/control/control.component";
import {HistoryComponent} from "./tabs/history/history.component";
import {OverviewComponent} from "./tabs/overview/overview.component";
import {SimulationComponent} from "./tabs/simulation/simulation.component";

const viewGuard: CanActivateFn = (route, state) => {
  switch (route.params["view"]) {
    case "model":
    case "map":
    case "pictures":
      return true;
    default:
      return inject(Router).createUrlTree([state.url, "../model"]);
  }
};

export const rainRetentionBasinRoutes: Routes = [
  {
    path: "overview/:view",
    component: OverviewComponent,
    canActivate: [viewGuard],
  },
  {path: "history", component: HistoryComponent},
  {path: "simulation", component: SimulationComponent},
  {path: "control", component: ControlComponent},
  {path: "**", redirectTo: "overview/model"}, // wildcard fallback
];
