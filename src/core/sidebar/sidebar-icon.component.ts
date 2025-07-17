import {NgComponentOutlet, AsyncPipe, KeyValuePipe} from "@angular/common";
import {
  inject,
  input,
  runInInjectionContext,
  Component,
  Injector,
} from "@angular/core";
import {NgIcon} from "@ng-icons/core";

import {SidebarEntry} from "../../sidebar";

@Component({
  selector: "sidebar-icon",
  imports: [NgIcon, KeyValuePipe, NgComponentOutlet, AsyncPipe],
  template: `
    @let iconVal = icon();
    @if (isRecord(iconVal)) {
      <ng-icon [name]="(iconVal | keyvalue)[0].key"></ng-icon>
    } @else if (isComponent(iconVal)) {
      <ng-container *ngComponentOutlet="$any(iconVal)"></ng-container>
    } @else {
      <ng-icon [svg]="(runInInjectionContext(iconVal) | async) ?? undefined"></ng-icon>
    }
  `,
})
export class SidebarIconComponent {
  readonly icon = input.required<SidebarEntry["icon"]>();

  protected isRecord(
    icon: SidebarEntry["icon"],
  ): icon is Record<string, string> {
    return typeof icon == "object";
  }

  protected isComponent(
    icon: SidebarEntry["icon"],
  ): icon is new (...args: any[]) => Component {
    return "ɵcmp" in icon;
  }

  private injector = inject(Injector);
  protected runInInjectionContext<T>(fn: () => T): T {
    return runInInjectionContext(this.injector, fn);
  }
}
