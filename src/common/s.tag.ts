import {computed, isSignal, Signal} from "@angular/core";

type MaybeSignal<T> = T | Signal<T>;

/**
 * Tagged template helper for creating a `Signal<string>` from a template literal.
 *
 * This function lets you interpolate signals into strings and get a reactive signal result.
 * Each placeholder in the template can be a signal or a plain value (string, number, boolean).
 *
 * Example:
 * ```ts
 * const name = signal("World");
 * const greeting = s`Hello, ${name}!`;
 * greeting(); // "Hello, World"
 * ```
 *
 * @param template The raw template string segments.
 * @param args The interpolated values, which can be signals or primitives.
 * @returns A computed signal that updates whenever one of the signals changes.
 */
export function s(
  template: TemplateStringsArray,
  ...args: MaybeSignal<string | number | boolean>[]
): Signal<string> {
  return computed(() => {
    let items: (string | number | boolean)[] = [];
    for (let i in args) {
      items.push(template[i]);
      if (isSignal(args[i])) items.push(args[i]());
      else items.push(args[i]);
    }
    items.push(template[template.length - 1]);
    return items.join("");
  });
}
