import {NgIf} from "@angular/common";
import {Component} from "@angular/core";
import {RouterOutlet} from "@angular/router";

import {NavbarComponent} from "./navbar/navbar.component";
import {SidebarComponent} from "./sidebar/sidebar.component";
import {signals} from "../common/signals";
import {IsAutoHideDirective} from "../common/directives/is-auto-hide.directive";

@Component({
    selector: "core",
    imports: [RouterOutlet, NavbarComponent, SidebarComponent, NgIf],
    templateUrl: "./core.component.html",
    styleUrl: "./core.component.scss",
    host: {
        "(click)": "onClick($event)",
    }
})
export class CoreComponent {
  sidebarActive = signals.toggleable(true);

  constructor(private autoHideService: IsAutoHideDirective.Service) {}

  onClick(event: PointerEvent) {
    if (!(event.target instanceof Element)) return;
    if (event.type !== "click") return;
    this.autoHideService.trigger.set(event.target);
  }
}
