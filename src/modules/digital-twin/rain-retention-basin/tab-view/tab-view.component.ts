import {Component} from "@angular/core";
import {RouterLinkActive, RouterLink, RouterOutlet} from "@angular/router";
import {provideIcons, NgIconComponent} from "@ng-icons/core";
import {
  remixBarChart2Line,
  remixLineChartLine,
  remixPlayCircleLine,
  remixMapPin2Line,
  remixBinocularsLine,
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
      remixPlayCircleLine,
      remixBinocularsLine,
      remixBarChart2Line,
      remixMapPin2Line,
    }),
  ],
})
export class TabViewComponent {}
