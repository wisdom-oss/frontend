import {input, signal, Directive} from "@angular/core";

@Directive({
  selector: "a[routerLink]",
  host: {"[class.is-active]": "isActive()"},
})
export class SidebarLinkDirective {
  readonly routerLink = input.required<string>();
  readonly isActive = signal(false);
}
