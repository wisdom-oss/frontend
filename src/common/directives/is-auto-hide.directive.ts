import {
  effect,
  signal,
  untracked,
  Directive,
  Injectable,
  Input,
  ElementRef,
  WritableSignal,
} from "@angular/core";

@Directive({
  selector: "[is-auto-hide]",
  standalone: true,
  host: {
    "[class.is-active]": "isActive()",
  },
})
export class IsAutoHideDirective {
  @Input("is-active-signal")
  isActive: WritableSignal<boolean> = signal(false, {equal: () => false});

  constructor(
    private service: IsAutoHideDirective.Service,
    private elementRef: ElementRef,
  ) {
    effect(
      () => {
        let element = service.trigger();
        if (!elementRef.nativeElement.contains(element)) {
          this.isActive.set(false);
        }
      },
      {allowSignalWrites: true},
    );
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
