import {bootstrapApplication} from "@angular/platform-browser";

import {CoreComponent} from "./core/core.component";
import {wisdomAppConfig} from "./config";

bootstrapApplication(CoreComponent, wisdomAppConfig).catch(err =>
  console.error(err),
);
