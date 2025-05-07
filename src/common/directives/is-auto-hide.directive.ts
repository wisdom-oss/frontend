import {
  effect,
  signal,
  Directive,
  Injectable,
  Input,
  ElementRef,
  WritableSignal,
} from "@angular/core";

/**
 * Directive to remove `is-active` css class when clicked outside of host.
 *
 * Use this directive in situations where Bulma checks for the css class
 * `is-active`.
 * By using this class, users can simply click away from the element to hide
 * the element.
 *
 * If the components already bound the `is-active` css class, you can use the
 * `is-active-signal` input to provide a signal that should be toggled instead.
 */
@Directive({
  selector: "[is-auto-hide]",
  standalone: true,
  host: {
    "[class.is-active]": "isActive()",
  },
})
export class IsAutoHideDirective {
  /**
   * Signal that is toggled.
   * May be provided to to define what signal to toggle, otherwise a new one
   * will be created.
   */
  @Input("is-active-signal")
  isActive: WritableSignal<boolean> = signal(false, {equal: () => false});

  constructor(
    private service: IsAutoHideDirective.Service,
    private elementRef: ElementRef,
  ) {
    effect(() => {
      let element = service.trigger();
      if (!element) return;
      if (!elementRef.nativeElement.contains(element)) {
        this.isActive.set(false);
      }
    });
  }
}

export namespace IsAutoHideDirective {
  @Injectable({
    providedIn: "root",
  })
  export class Service {
    readonly trigger = signal<Element | null>(null, {equal: () => false});
  }
}
