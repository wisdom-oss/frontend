import {NgIf} from "@angular/common";
import {Component} from "@angular/core";
import {RouterOutlet} from "@angular/router";

import {NavbarComponent} from "./navbar/navbar.component";
import {SidebarComponent} from "./sidebar/sidebar.component";
import {signals} from "../common/signals";

@Component({
  selector: "core",
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, SidebarComponent, NgIf],
  templateUrl: "./core.component.html",
  styleUrl: "./core.component.scss",
})
export class CoreComponent {
  sidebarActive = signals.toggleable(true);
}
