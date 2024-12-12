import {Component} from "@angular/core";
import {RouterLink} from "@angular/router";
import {provideIcons, NgIconComponent} from "@ng-icons/core";
import {remixDatabase2Fill, remixMap2Fill} from "@ng-icons/remixicon";

@Component({
  selector: "sidebar",
  imports: [NgIconComponent, RouterLink],
  templateUrl: "./sidebar.component.html",
  styleUrl: "./sidebar.component.scss",
  providers: [
    provideIcons({
      remixMap2Fill,
      remixDatabase2Fill,
    }),
  ],
})
export class SidebarComponent {}
