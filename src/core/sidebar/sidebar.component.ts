import {HttpClient} from "@angular/common/http";
import {
  computed,
  inject,
  ViewChildren,
  Component,
  AfterViewInit,
  QueryList,
} from "@angular/core";
import {NavigationEnd, RouterLink, Router} from "@angular/router";
import {
  provideIcons,
  provideNgIconLoader,
  NgIconComponent,
  NgIconStack,
} from "@ng-icons/core";
import {
  remixBarChartFill,
  remixBookLine,
  remixBookShelfLine,
  remixBuilding3Fill,
  remixDatabase2Fill,
  remixDrizzleFill,
  remixInstanceLine,
  remixLineChartLine,
  remixMap2Fill,
  remixMapLine,
  remixRfidLine,
  remixSunCloudyFill,
  remixWaterPercentFill,
} from "@ng-icons/remixicon";
import {TranslateDirective} from "@ngx-translate/core";
import {filter} from "rxjs";

import {SidebarLinkDirective} from "./sidebar-link.directive";
import {OowvActionMapComponent} from "../../modules/oowv/action-map/action-map.component";
import {PumpModelsComponent} from "../../modules/pump-models/pump-models.component";
import {AuthService} from "../auth/auth.service";

@Component({
  selector: "sidebar",
  imports: [
    NgIconComponent,
    NgIconStack,
    RouterLink,
    SidebarLinkDirective,
    TranslateDirective,
  ],
  templateUrl: "./sidebar.component.html",
  styleUrl: "./sidebar.component.scss",
  providers: [
    provideIcons({
      remixBarChartFill,
      remixBookLine,
      remixBookShelfLine,
      remixBuilding3Fill,
      remixDatabase2Fill,
      remixDrizzleFill,
      remixInstanceLine,
      remixLineChartLine,
      remixMap2Fill,
      remixMapLine,
      remixRfidLine,
      remixSunCloudyFill,
      remixWaterPercentFill,
    }),
    provideNgIconLoader(name => {
      if (name != "oowv") return "";
      const http = inject(HttpClient);
      return http.get("https://www.oowv.de/favicons/favicon.svg", {
        responseType: "text",
      });
    }),
  ],
})
export class SidebarComponent implements AfterViewInit {
  @ViewChildren(SidebarLinkDirective)
  routerLinks?: QueryList<SidebarLinkDirective>;

  protected authorized = {
    oowvActionMap: computed(() =>
      this.auth.scopes().has(...OowvActionMapComponent.SCOPES),
    ),
    pumpModels: computed(() =>
      this.auth.scopes().has(...PumpModelsComponent.SCOPES),
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
          paths: "subset",
          fragment: "ignored",
        }),
      );
    });
  }
}
