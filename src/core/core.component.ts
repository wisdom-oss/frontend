import {NgIf} from "@angular/common";
import {effect, Component} from "@angular/core";
import {RouterOutlet} from "@angular/router";

import {NavbarComponent} from "./navbar/navbar.component";
import {SidebarComponent} from "./sidebar/sidebar.component";
import {signals} from "../common/signals";
import {IsAutoHideDirective} from "../common/directives/is-auto-hide.directive";
import {StorageService} from "../common/storage.service";

@Component({
  selector: "core",
  imports: [RouterOutlet, NavbarComponent, SidebarComponent, NgIf],
  templateUrl: "./core.component.html",
  styleUrl: "./core.component.scss",
  host: {
    "(click)": "onClick($event)",
  },
})
export class CoreComponent {
  sidebarActive = signals.toggleable(true);
  storage: StorageService.Storages;

  constructor(
    private autoHideService: IsAutoHideDirective.Service,
    storageService: StorageService,
  ) {
    this.storage = storageService.instance(CoreComponent);

    effect(() =>
      this.storage.session.set("sidebar", JSON.stringify(this.sidebarActive())),
    );
    
    this.sidebarActive.set(
      JSON.parse(this.storage.session.get("sidebar") ?? "true"),
    );
  }

  onClick(event: PointerEvent) {
    if (!(event.target instanceof Element)) return;
    if (event.type !== "click") return;
    this.autoHideService.trigger.set(event.target);
  }
}
