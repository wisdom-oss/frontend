import {Routes} from "@angular/router";

import {MapSelectViewComponent} from "./views/map-select-view/map-select-view.component";
import {ResultDataViewComponent} from "./views/result-data-view/result-data-view.component";
import {queryParameterGuard} from "../../core/query-parameter.guard";

export const longTermForecastRoutes: Routes = [
  {path: "", component: MapSelectViewComponent},
  {
    path: "results",
    component: ResultDataViewComponent,
    // TODO: figure out, how I can just write "" here
    canActivate: [queryParameterGuard("key", "/long-term-forecast")],
  },
  {path: "**", redirectTo: ""}, // wildcard fallback
];
