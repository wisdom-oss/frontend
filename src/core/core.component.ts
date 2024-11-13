import {Component} from "@angular/core";

import {NavbarComponent} from "./navbar/navbar.component";
import { SidebarComponent } from "./sidebar/sidebar.component";
import { signals } from "../common/signals";
import { NgIf } from "@angular/common";

@Component({
  selector: "core",
  standalone: true,
  imports: [NavbarComponent, SidebarComponent, NgIf],
  templateUrl: "./core.component.html",
  styleUrl: "./core.component.scss",
})
export class CoreComponent {
  sidebarActive = signals.toggleable(true);
}
