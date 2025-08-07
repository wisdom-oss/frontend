import {HttpClient} from "@angular/common/http";
import {
  computed,
  effect,
  inject,
  runInInjectionContext,
  signal,
  untracked,
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
import dayjs from "dayjs";
import {filter} from "rxjs";

import {SidebarLinkDirective} from "./sidebar-link.directive";
import {SidebarMenuLabelDirective} from "./sidebar-menu-label.directive";
import {SidebarIconComponent} from "./sidebar-icon.component";
import {sidebar, SidebarEntry} from "../../sidebar";
import {StatusService} from "../../api/status.service";
import {api} from "../../common/api";
import {AuthService} from "../auth/auth.service";
import {Scopes} from "../auth/scopes";

const SIDEBAR_ENTRIES = sidebar();

@Component({
  selector: "sidebar",
  imports: [
    NgIconComponent,
    RouterLink,
    SidebarIconComponent,
    SidebarLinkDirective,
    SidebarMenuLabelDirective,
    TranslateDirective,
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
  private auth = inject(AuthService);

  private injector = inject(Injector);
  protected entries = runInInjectionContext(this.injector, () =>
    SIDEBAR_ENTRIES.map(category => ({
      ...category,
      modules: category.modules.map(module => ({
        ...module,
        // this ensures that the visible signal is only constructed once
        visible: module.visible?.() ?? signal(true),
        services: Object.map(module.services, token => inject(token)),
        authorized: computed(() =>
          this.auth.scopes().has(...(module.scopes ?? [])),
        ),
      })),
    })),
  );

  private services = computed<Record<string, InstanceType<api.Service>>>(() =>
    Object.assign(
      {},
      ...this.entries.flatMap(category =>
        category.modules.map(module => {
          if (module.visible() && module.authorized()) return module.services;
          return {};
        }),
      ),
    ),
  );

  private statusSubscribe = effect(() => {
    this.status.socket.send({
      command: "subscribe",
      id: "",
      data: {
        paths: Object.values(this.services()).map(service => service.URL),
        updateInterval: dayjs.duration(15, "seconds"),
      },
    });
  });

  private serviceStatus = computed(() => {
    let status = this.status.socket();
    if (!status) return undefined;
    return Object.map(untracked(this.services), service =>
      status.find(status => status.path == service.URL),
    );
  });

  private onMessage = effect(() => console.log(this.serviceStatus()));

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
