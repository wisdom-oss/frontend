import {
  effect,
  input,
  runInInjectionContext,
  Directive,
  AfterViewInit,
  Injector,
  ElementRef,
} from "@angular/core";
import {toSignal} from "@angular/core/rxjs-interop";
import {TranslateService} from "@ngx-translate/core";

/**
 * A directive that allows reactive translation of HTML attributes.
 *
 * This directive is useful for libraries or components that rely on specific
 * attributes (e.g., `data-*` attributes) to display text, such as tooltips.
 * It automatically updates the attribute value when the translation changes.
 *
 * @example Translate tooltip text
 * ```html
 * <div
 *   class="has-tooltip-bottom"
 *   [translate-attr]="{attr: 'data-tooltip', key: 'core.remember'}"
 * ></div>
 * ```
 * In this example:
 * - `attr`: Specifies the attribute to set (e.g., `data-tooltip`).
 * - `key`: The translation key used to fetch the localized text.
 */
@Directive({
  selector: "[translate-attr]=",
})
export class TranslateAttrDirective implements AfterViewInit {
  readonly input = input.required<{attr: string; key: string}>({
    alias: "translate-attr",
  });

  constructor(
    private element: ElementRef,
    private translate: TranslateService,
    private injector: Injector,
  ) {}

  ngAfterViewInit(): void {
    runInInjectionContext(this.injector, () => {
      let {attr, key} = this.input();
      let nativeElement = this.element.nativeElement;
      let translation = toSignal(this.translate.stream(key));
      effect(() => nativeElement.setAttribute(attr, translation()));
    });
  }
}
