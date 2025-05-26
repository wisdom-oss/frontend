import {inject, Pipe, PipeTransform} from "@angular/core";

import {EmptyPipe} from "./empty.pipe";

/**
 * Marks a value as "non-empty".
 *
 * This is the exact inverse of {@link EmptyPipe}.
 * Returns **true** when the value is not empty
 * (e.g. a non-empty string, array, or object),
 * **false** when it is empty, and **null** when the type is not handled.
 *
 * @example
 * ```html
 * {{ name | some }}      <!-- true when name is not "" -->
 * {{ items | some }}     <!-- true when items has at least one entry -->
 * ```
 *
 * @see {@link EmptyPipe}
 */
@Pipe({
  name: "some",
})
export class SomePipe implements PipeTransform {
  private empty = new EmptyPipe();

  transform(value: null): false;
  transform(value: undefined): false;
  transform(value?: string): boolean;
  transform(value?: any[]): boolean;
  transform(value?: object): boolean;
  transform(value: unknown, ..._args: unknown[]): unknown {
    let empty = this.empty.transform(value as any) as boolean | null;
    switch (empty) {
      case true:
        return false;
      case false:
        return true;
      case null:
        return null;
    }
  }
}
