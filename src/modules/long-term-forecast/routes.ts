import {Routes} from "@angular/router";

import {MapSelectViewComponent} from "./views/map-select-view/map-select-view.component";
import {ResultDataViewComponent} from "./views/result-data-view/result-data-view.component";

export const longTermForecastRoutes: Routes = [
  {path: "", component: MapSelectViewComponent},
  {path: "results", component: ResultDataViewComponent},
  {path: "**", redirectTo: ""}, // wildcard fallback
];
