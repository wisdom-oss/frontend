import {Component} from "@angular/core";
import {RouterLinkActive, RouterLink, RouterOutlet} from "@angular/router";
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
    RouterLinkActive,
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
