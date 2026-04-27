import {Routes} from "@angular/router";

import {HistoryComponent} from "./tabs/history/history.component";
import {OverviewComponent} from "./tabs/overview/overview.component";
import {SimulationComponent} from "./tabs/simulation/simulation.component";

export const braintankRoutes: Routes = [
  {path: "overview", component: OverviewComponent},
  {path: "history", component: HistoryComponent},
  {path: "simulation", component: SimulationComponent},
  {path: "**", redirectTo: "overview"}, // wildcard fallback
];
