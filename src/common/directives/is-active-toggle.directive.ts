import {signal, Directive, Input, WritableSignal} from "@angular/core";

/**
 * Directive to toggle `is-active` class on click event.
 */
@Directive({
  selector: "[is-active-toggle]",
  standalone: true,
  host: {
    "[class.is-active]": "isActive()",
    "(click)": "toggle()",
  },
})
export class IsActiveToggleDirective {
  @Input("is-active-signal")
  isActive: WritableSignal<boolean> = signal(false, {equal: () => false});

  toggle() {
    this.isActive.set(!this.isActive());
  }
}
