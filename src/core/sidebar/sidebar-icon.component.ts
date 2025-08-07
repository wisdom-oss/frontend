import {NgComponentOutlet, KeyValuePipe} from "@angular/common";
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
  imports: [NgIcon, KeyValuePipe, NgComponentOutlet],
  template: `
    @let iconVal = icon();
    @if (isURL(iconVal)) {
      <ng-icon [name]="iconVal.toString()"></ng-icon>
    } @else if (isRecord(iconVal)) {
      <ng-icon [name]="(iconVal | keyvalue)[0].key"></ng-icon>
    } @else {
      <ng-container *ngComponentOutlet="iconVal"></ng-container>
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

  protected isURL(icon: SidebarEntry["icon"]): icon is URL {
    return icon instanceof URL;
  }

  private injector = inject(Injector);
  protected runInInjectionContext<T>(fn: () => T): T {
    return runInInjectionContext(this.injector, fn);
  }
}
