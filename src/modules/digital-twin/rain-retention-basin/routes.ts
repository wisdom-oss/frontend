import {CanActivateFn, Router, Routes} from "@angular/router";

import { TabViewComponent } from "./tab-view/tab-view.component";
import { SelectBasinViewComponent } from "./select-basin-view/select-basin-view.component";
import { queryParameterGuard } from "../../../core/query-parameter.guard";
import { inject } from "@angular/core";
import { ControlComponent } from "./tabs/control/control.component";
import { HistoryComponent } from "./tabs/history/history.component";
import { OverviewComponent } from "./tabs/overview/overview.component";
import { SimulationComponent } from "./tabs/simulation/simulation.component";

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
  {path: "", component: SelectBasinViewComponent},
  {
    path: "tabs", 
    component: TabViewComponent,
    canActivate: [queryParameterGuard("id", "/digital-twin/rain-retention-basin")],
    children: [
      {
        path: "overview/:view",
        component: OverviewComponent,
        canActivate: [viewGuard],
      },
      { path: "history", component: HistoryComponent },
      { path: "simulation", component: SimulationComponent },
      { path: "control", component: ControlComponent },
      
      // Standard-Tab, wenn man nur /tabs aufruft
      { path: "", redirectTo: "overview/model", pathMatch: "full" },
      // Wildcard für falsche Unterpfade innerhalb der Tabs
      { path: "**", redirectTo: "overview/model" }
    ]

  },
  {path: "**", redirectTo: ""}, // wildcard fallback
];
