import {signal, Component, WritableSignal} from "@angular/core";
import {RouterLinkActive, RouterLink, RouterOutlet} from "@angular/router";
import {provideIcons, NgIconComponent} from "@ng-icons/core";
import {
  remixGamepadLine,
  remixLineChartLine,
  remixMovieLine,
  remixProfileLine,
} from "@ng-icons/remixicon";
import {TranslateDirective} from "@ngx-translate/core";

import {Scopes} from "../../../core/auth/scopes";

@Component({
  imports: [
    NgIconComponent,
    TranslateDirective,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
  ],
  templateUrl: "./rain-retention-basin.component.html",
  styleUrl: "./rain-retention-basin.component.scss",
  providers: [
    provideIcons({
      remixLineChartLine,
      remixMovieLine,
      remixProfileLine,
      remixGamepadLine,
    }),
  ],
})
export class RainRetentionBasinComponent {}
