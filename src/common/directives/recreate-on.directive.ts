import {
  inject,
  input,
  OnChanges,
  SimpleChanges,
  Directive,
  ViewContainerRef,
  TemplateRef,
} from "@angular/core";

/**
 * Structural directive that recreates its embedded view whenever the bound key changes.
 *
 * Why
 * - Some 3rd-party components only read inputs on init.
 * - This directive forces a clean re-create on a key change.
 *
 * Usage
 * ```html
 * <!-- Store the signal value with @let -->
 * @let attribution = this.attribution();
 *
 * <!-- Recreate the control whenever 'attribution' changes -->
 * <ng-container *recreateOn="attribution">
 *   <mgl-control
 *     mglAttribution
 *     position="bottom-right"
 *     [compact]="true"
 *     [customAttribution]="attribution"
 *   ></mgl-control>
 * </ng-container>
 * ```
 *
 * Notes
 * - This destroys and re-adds the subtree. Any local state inside will reset.
 * - Bind any value as the key. If you need to force a rebuild even when the value is equal,
 *   pass a version counter signal instead.
 */
@Directive({
  selector: "[recreateOn]",
})
export class RecreateOnDirective implements OnChanges {
  /**
   * Key to watch. When it changes, we clear and recreate the view.
   * Can be any type.
   */
  readonly recreateOn = input<unknown>();

  private vcr = inject(ViewContainerRef);
  private tpl = inject(TemplateRef<unknown>);

  ngOnChanges(_: SimpleChanges): void {
    this.vcr.clear();
    this.vcr.createEmbeddedView(this.tpl);
  }
}
