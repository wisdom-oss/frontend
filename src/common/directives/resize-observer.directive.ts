import {output, Directive, ElementRef, OnDestroy} from "@angular/core";

/**
 * Directive that listens for resize events on the attached element
 * and emits the entries through the `resize` output.
 *
 * The directive uses a `ResizeObserver` to monitor the size changes
 * of the element and emits an array of `ResizeObserverEntry` objects
 * whenever the element is resized.
 *
 * @example
 * ```html
 * <div resize-observer (resize)="onResize($event)"></div>
 * ```
 */
@Directive({
  selector: "[resize-observer]",
})
export class ResizeObserverDirective implements OnDestroy {
  readonly resize = output<ResizeObserverEntry[]>();

  private observer = new ResizeObserver(entries => this.resize.emit(entries));

  constructor(private element: ElementRef) {
    this.observer.observe(element.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer.disconnect();
  }
}
