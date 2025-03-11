import {Routes} from "@angular/router";

import {MapSelectViewComponent} from "./views/map-select-view/map-select-view.component";

export const longTermForecastRoutes: Routes = [
  {path: "", component: MapSelectViewComponent},
  {path: "**", redirectTo: ""}, // wildcard fallback
];
