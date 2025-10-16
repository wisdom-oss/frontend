import {Routes} from "@angular/router";

import {DetailViewComponent} from "./views/detail-view/detail-view.component";
import {SelectViewComponent} from "./views/select-view/select-view.component";
import {queryParameterGuard} from "../../core/query-parameter.guard";

export const waterRightsRoutes: Routes = [
  {path: "", component: SelectViewComponent},
  {
    path: "details",
    component: DetailViewComponent,
    // TODO: figure out, how I can just write "" here
    canActivate: [queryParameterGuard("no", "/water-rights")],
  },
  {path: "**", redirectTo: ""}, // wildcard fallback
];
