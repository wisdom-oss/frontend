import {ViewChildren, Component, AfterViewInit, QueryList} from "@angular/core";
import {NavigationEnd, RouterLink, Router} from "@angular/router";
import {provideIcons, NgIconComponent} from "@ng-icons/core";
import {remixBookLine, remixBookShelfLine} from "@ng-icons/remixicon";
import {filter} from "rxjs";

import {SidebarLinkDirective} from "./sidebar-link.directive";

@Component({
  selector: "sidebar",
  imports: [NgIconComponent, RouterLink, SidebarLinkDirective],
  templateUrl: "./sidebar.component.html",
  styleUrl: "./sidebar.component.scss",
  providers: [
    provideIcons({
      remixBookShelfLine,
      remixBookLine,
    }),
  ],
})
export class SidebarComponent implements AfterViewInit {
  @ViewChildren(SidebarLinkDirective)
  routerLinks?: QueryList<SidebarLinkDirective>;

  constructor(private router: Router) {}

  ngAfterViewInit(): void {
    this.highlightCurrentRoute();
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => this.highlightCurrentRoute());
  }

  private highlightCurrentRoute() {
    this.routerLinks?.forEach(routerLink => {
      let link = routerLink.routerLink();
      routerLink.isActive.set(
        this.router.isActive(link, {
          matrixParams: "ignored",
          queryParams: "ignored",
          paths: "exact",
          fragment: "ignored",
        }),
      );
    });
  }
}
