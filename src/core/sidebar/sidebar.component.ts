import {HttpClient} from "@angular/common/http";
import {
  computed,
  effect,
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
import {
  provideIcons,
  provideNgIconLoader,
  NgIconComponent,
} from "@ng-icons/core";
import {remixErrorWarningFill} from "@ng-icons/remixicon";
import {TranslateDirective} from "@ngx-translate/core";
import {filter} from "rxjs";

import {SidebarLinkDirective} from "./sidebar-link.directive";
import {SidebarMenuLabelDirective} from "./sidebar-menu-label.directive";
import {SidebarIconComponent} from "./sidebar-icon.component";
import {sidebar, SidebarEntry} from "../../sidebar";
import {StatusService} from "../../api/status.service";
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
    NgIconComponent,
    RouterLink,
    SidebarIconComponent,
    SidebarLinkDirective,
    SidebarMenuLabelDirective,
    TranslateDirective,
    UnauthorizedPipe,
  ],
  templateUrl: "./sidebar.component.html",
  styleUrl: "./sidebar.component.scss",
  providers: [
    provideIcons({
      ...extractNgIcons(SIDEBAR_ENTRIES),
      remixErrorWarningFill,
    }),
    provideNgIconLoader(icon => {
      if (!icon.startsWith("http")) return "";
      const http = inject(HttpClient);
      return http.get(icon, {
        responseType: "text",
      });
    }),
  ],
})
export class SidebarComponent implements AfterViewInit {
  private router = inject(Router);
  private status = inject(StatusService);

  private injector = inject(Injector);
  protected entries = runInInjectionContext(this.injector, () =>
    SIDEBAR_ENTRIES.map(category => ({
      ...category,
      modules: category.modules.map(module => ({
        ...module,
        // this ensures that the visible signal is only constructed once
        visible: module.visible?.(),
      })),
    })),
  );

  private onMessage = effect(() => console.log(this.status.socket()));

  @ViewChildren(SidebarLinkDirective)
  routerLinks?: QueryList<SidebarLinkDirective>;

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
    ...entries
      .map(entry => entry.icon)
      .filter(icon => !(icon instanceof URL))
      .filter(icon => typeof icon == "object"),
    ...entries
      .map(entry => entry.modules)
      .flat()
      .map(module => module.icon)
      .filter(icon => !(icon instanceof URL))
      .filter(icon => typeof icon == "object"),
  );
}
