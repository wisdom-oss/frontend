import {Component} from "@angular/core";
import {RouterLinkActive, RouterLink, RouterOutlet} from "@angular/router";
import {provideIcons, NgIconComponent} from "@ng-icons/core";
import {
  remixGamepadLine,
  remixLineChartLine,
  remixMovieLine,
  remixProfileLine,
  remixMapPin2Line,
} from "@ng-icons/remixicon";
import { TranslateDirective } from "@ngx-translate/core";

@Component({
  imports: [
    NgIconComponent,
    TranslateDirective,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
],
  templateUrl: "./tab-view.component.html",
  styleUrl: "./tab-view.component.scss",
  providers: [
    provideIcons({
      remixLineChartLine,
      remixMovieLine,
      remixProfileLine,
      remixGamepadLine,
      remixMapPin2Line,
    }),
  ],
})
export class TabViewComponent {}
