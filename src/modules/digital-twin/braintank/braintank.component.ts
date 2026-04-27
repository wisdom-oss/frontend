import {effect, inject, signal, Component} from "@angular/core";
import {RouterLink, RouterOutlet, ActivatedRoute} from "@angular/router";
import {ɵɵRouterLinkActive} from "@angular/router/testing";
import {provideIcons, NgIconComponent} from "@ng-icons/core";
import {
  remixLineChartLine,
  remixMovieLine,
  remixProfileLine,
} from "@ng-icons/remixicon";
import {TranslateDirective} from "@ngx-translate/core";

@Component({
  imports: [
    NgIconComponent,
    RouterLink,
    RouterOutlet,
    TranslateDirective,
    ɵɵRouterLinkActive,
  ],
  templateUrl: "./braintank.component.html",
  styleUrl: "./braintank.component.scss",
  providers: [
    provideIcons({
      remixLineChartLine,
      remixMovieLine,
      remixProfileLine,
    }),
  ],
})
export class BraintankComponent {}
