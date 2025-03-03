import {
  computed,
  ViewChildren,
  Component,
  AfterViewInit,
  QueryList,
} from "@angular/core";
import {NavigationEnd, RouterLink, Router} from "@angular/router";
import {provideIcons, NgIconComponent} from "@ng-icons/core";
import {
  remixDatabase2Fill,
  remixFileShield2Fill,
  remixMap2Fill,
  remixSafe2Line,
} from "@ng-icons/remixicon";
import {filter} from "rxjs";

import {SidebarLinkDirective} from "./sidebar-link.directive";
import {NeedsAuthComponent} from "../../modules/needs-auth/needs-auth.component";
import {AuthService} from "../auth/auth.service";

@Component({
  selector: "sidebar",
  imports: [NgIconComponent, RouterLink, SidebarLinkDirective],
  templateUrl: "./sidebar.component.html",
  styleUrl: "./sidebar.component.scss",
  providers: [
    provideIcons({
      remixMap2Fill,
      remixDatabase2Fill,
      remixSafe2Line,
      remixFileShield2Fill,
    }),
  ],
})
export class SidebarComponent implements AfterViewInit {
  @ViewChildren(SidebarLinkDirective)
  routerLinks?: QueryList<SidebarLinkDirective>;

  protected authorized = {
    needsAuth: computed(() =>
      this.auth.scopes().has(...NeedsAuthComponent.SCOPES),
    ),
  };

  constructor(
    private router: Router,
    private auth: AuthService,
  ) {}

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
