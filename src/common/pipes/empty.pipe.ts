import {Pipe, PipeTransform} from "@angular/core";

/**
 * Marks a value as "empty".
 *
 * Returns **true** when the input is:
 * * `null`
 * * `undefined`
 * * an empty string (`""`)
 * * an empty array (`[]`)
 * * an object with no own values (`{}`)
 *
 * Returns **false** for any other value.  
 * If the type is not covered above, it falls back to **null**.
 *
 * @example
 * ```html
 * {{ name | empty }}      <!-- true when name is "" -->
 * {{ items | empty }}     <!-- true when items = [] -->
 * ```
 */
@Pipe({name: "empty"})
export class EmptyPipe implements PipeTransform {
  transform(value: null): true;
  transform(value: undefined): true;
  transform(value?: string): boolean;
  transform(value?: any[]): boolean;
  transform(value?: object): boolean;
  transform(value: unknown, ..._args: unknown[]): unknown {
    if (value === null) return true;
    if (value === undefined) return true;
    if (typeof value === "string") return !value;
    if (Array.isArray(value)) return !value.length;
    if (typeof value === "object") return !Object.values(value).length;
    return null;
  }
}
