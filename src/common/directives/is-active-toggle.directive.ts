import {signal, Directive, Input, WritableSignal} from "@angular/core";

/**
 * Directive to toggle `is-active` css class on click event.
 *
 * Use this directive in situations where Bulma checks for the css class
 * `is-active`.
 * By using this class, users can simply click on the element in order to toggle
 * its visibility.
 *
 * If the components already bound the `is-active` css class, you can use the
 * `is-active-signal` input to provide a signal that should be toggled instead.
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
  /**
   * Signal that is toggled.
   * May be provided to to define what signal to toggle, otherwise a new one
   * will be created.
   */
  @Input("is-active-signal")
  isActive: WritableSignal<boolean> = signal(false, {equal: () => false});

  /**
   * Toggle the signal that represents the `isActive` state.
   */
  toggle() {
    this.isActive.set(!this.isActive());
  }
}
