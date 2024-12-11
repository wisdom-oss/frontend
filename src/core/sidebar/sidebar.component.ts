import {Component} from "@angular/core";
import {RouterLink} from "@angular/router";
import {provideIcons, NgIconComponent} from "@ng-icons/core";
import {remixBookLine, remixBookShelfLine} from "@ng-icons/remixicon";

@Component({
  selector: "sidebar",
  imports: [NgIconComponent, RouterLink],
  templateUrl: "./sidebar.component.html",
  styleUrl: "./sidebar.component.scss",
  providers: [
    provideIcons({
      remixBookShelfLine,
      remixBookLine,
    }),
  ],
})
export class SidebarComponent {}
