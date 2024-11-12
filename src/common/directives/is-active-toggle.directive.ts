import {signal, Directive} from "@angular/core";

import {signals} from "../signals";

/**
 * Directive to toggle `is-active` class on click event.
 */
@Directive({
  selector: "[is-active-toggle]",
  standalone: true,
  host: {
    "[class.is-active]": "isActive()",
    "(click)": "isActive.toggle()",
  },
})
export class IsActiveToggleDirective {
  isActive = signals.toggleable(false);
}
