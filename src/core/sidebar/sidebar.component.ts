import {
  computed,
  inject,
  runInInjectionContext,
  ViewChildren,
  Component,
  AfterViewInit,
  Injector,
  QueryList,
  Pipe,
  Signal,
  PipeTransform,
} from "@angular/core";
import {NavigationEnd, RouterLink, Router} from "@angular/router";
import {provideIcons} from "@ng-icons/core";
import {TranslateDirective} from "@ngx-translate/core";
import {filter} from "rxjs";

import {SidebarLinkDirective} from "./sidebar-link.directive";
import {SidebarMenuLabelDirective} from "./sidebar-menu-label.directive";
import {SidebarIconComponent} from "./sidebar-icon.component";
import {sidebar, SidebarEntry} from "../../sidebar";
import {AuthService} from "../auth/auth.service";
import {Scopes} from "../auth/scopes";

const SIDEBAR_ENTRIES = sidebar();

@Pipe({name: "unauthorized"})
export class UnauthorizedPipe implements PipeTransform {
  protected auth = inject(AuthService);

  transform(scopes?: Scopes.Scope[]): Signal<boolean> {
    return computed(() => {
      if (!scopes) return false;
      return !this.auth.scopes().has(...scopes);
    });
  }
}

@Component({
  selector: "sidebar",
  imports: [
    RouterLink,
    SidebarIconComponent,
    SidebarLinkDirective,
    SidebarMenuLabelDirective,
    TranslateDirective,
    UnauthorizedPipe,
  ],
  templateUrl: "./sidebar.component.html",
  styleUrl: "./sidebar.component.scss",
  providers: [provideIcons(extractNgIcons(SIDEBAR_ENTRIES))],
})
export class SidebarComponent implements AfterViewInit {
  private router = inject(Router);

  protected entries = SIDEBAR_ENTRIES;

  @ViewChildren(SidebarLinkDirective)
  routerLinks?: QueryList<SidebarLinkDirective>;

  ngAfterViewInit(): void {
    this.highlightCurrentRoute();
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => this.highlightCurrentRoute());
  }

  private injector = inject(Injector);
  protected runInInjectionContext<T>(fn: () => T): T {
    return runInInjectionContext(this.injector, fn);
  }

  private highlightCurrentRoute() {
    this.routerLinks?.forEach(routerLink => {
      let link = routerLink.routerLink();
      routerLink.isActive.set(
        this.router.isActive(link, {
          matrixParams: "ignored",
          queryParams: "ignored",
          paths: "subset",
          fragment: "ignored",
        }),
      );
    });
  }
}

function extractNgIcons(
  entries: readonly SidebarEntry[],
): Record<string, string> {
  return Object.assign(
    {},
    ...entries.map(entry => entry.icon).filter(icon => typeof icon == "object"),
    ...entries
      .map(entry => entry.modules)
      .flat()
      .map(module => module.icon)
      .filter(icon => typeof icon == "object"),
  );
}
