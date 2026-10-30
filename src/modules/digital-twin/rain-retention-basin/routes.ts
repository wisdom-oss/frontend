import {CanActivateFn, Router, Routes} from "@angular/router";

import { TabViewComponent } from "./tab-view/tab-view.component";
import { SelectBasinViewComponent } from "./select-basin-view/select-basin-view.component";
import { queryParameterGuard } from "../../../core/query-parameter.guard";
import { inject } from "@angular/core";
import { ValidationComponent } from "./tabs/validation/validation.component";
import { HistoryComponent } from "./tabs/history/history.component";
import { CurrentStatusComponent } from "./tabs/current-status/current-status.component";
import { SimulationComponent } from "./tabs/simulation/simulation.component";

const viewGuard: CanActivateFn = (route, state) => {
  switch (route.params["view"]) {
    case "model":
    case "map":
    case "pictures":
      return true;
    default:
      return inject(Router).createUrlTree([state.url, "../map"]);
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
        path: "current-status/:view",
        component: CurrentStatusComponent,
        canActivate: [viewGuard],
      },
      { path: "history", component: HistoryComponent },
      { path: "simulation", component: SimulationComponent },
      { path: "validation", component: ValidationComponent },
      
      // Standard-Tab, wenn man nur /tabs aufruft
      { path: "", redirectTo: "current-status/map", pathMatch: "full" },
      // Wildcard für falsche Unterpfade innerhalb der Tabs
      { path: "**", redirectTo: "current-status/map" }
    ]

  },
  {path: "**", redirectTo: ""}, // wildcard fallback
];
