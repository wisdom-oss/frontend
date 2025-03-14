import {effect, inject, signal, Signal, WritableSignal} from "@angular/core";
import {Duration} from "dayjs/plugin/duration";

import {injections} from "./injections";

/**
 * Custom signal extensions.
 *
 * These extend the signals provided by Angular but as they are defined via
 * interfaces, we cannot just class-extend them.
 * To work around these issues, we use `Object.defineProperty` to add methods we
 * require.
 */
export namespace signals {
  /**
   * A toggleable signal type that extends a writable signal.
   * Adds a `toggle` method for inverting the current boolean value of the signal.
   *
   * @template S A WritableSignal type holding a boolean value.
   */
  export type ToggleableSignal<S extends WritableSignal<boolean>> = S & {
    /**
     * Toggles the boolean value of the signal.
     */
    toggle(): void;
  };

  /**
   * Creates a toggleable signal that extends an Angular WritableSignal.
   * This signal provides a `toggle` method to invert its current value.
   *
   * @param initial The initial value or an existing WritableSignal.
   * @returns A signal with a `toggle` method.
   *
   * @example
   * const mySignal = signals.toggleable(true);
   * mySignal(); // true
   * mySignal.toggle();
   * mySignal(); // false
   */
  export function toggleable(
    initial: boolean,
  ): ToggleableSignal<WritableSignal<boolean>>;

  /**
   * Creates a toggleable signal from an existing WritableSignal.
   * Adds a `toggle` method to the signal.
   *
   * @template S A WritableSignal<boolean> type.
   * @param initial An existing WritableSignal to extend.
   * @returns The same signal extended with a `toggle` method.
   *
   * @example
   * const existingSignal = signal(true);
   * const toggleableSignal = signals.toggleable(existingSignal);
   * toggleableSignal(); // true
   * toggleableSignal.toggle();
   * toggleableSignal(); // false
   */
  export function toggleable<S extends WritableSignal<boolean>>(
    initial: S,
  ): ToggleableSignal<S>;

  /**
   * Implementation for the `toggleable` function.
   */
  export function toggleable<S extends WritableSignal<boolean>>(
    initial: boolean | S,
  ) {
    let s = typeof initial == "boolean" ? signal(initial) : initial;
    return Object.defineProperty(s, "toggle", {
      writable: false,
      value: () => {
        let value = s();
        s.set(!value);
      },
    });
  }

  /**
   * Retrieves the active language signal.
   *
   * This function returns the signal representing the currently selected
   * language as a language code (`"en"` or `"de"`).
   * It is useful for localization-related tasks, such as formatting dates
   * using Angular pipes.
   *
   * @example
   * const langSignal = signals.lang();
   * console.log(langSignal()); // "en" or "de"
   *
   * @attention This function requires an injection context.
   * Ensure it is called within an environment where Angular's dependency
   * injection is available, such as inside a component, directive, or
   * service constructor.
   */
  export const lang = () => inject(injections.LANG_SIGNAL);

  /**
   * Delays the signal's updates by a specified duration.
   *
   * This can be useful for resolving Angular lifecycle conflicts, as the signal
   * will not update immediately.
   * Setting no delay still delays by one update cycle, which can resolve issues
   * caused by update races.
   *
   * @example
   * const mySignal = signals.signal(1);
   * const delayedSignal = signals.delay(mySignal, Duration.fromMillis(500));
   * delayedSignal(); // Updates after a 500ms delay
   */
  export function delay<T>(s: Signal<T>, delay?: Duration): Signal<T> {
    let delayed = signal(s());
    effect(() => {
      let value = s();
      setTimeout(() => delayed.set(value), delay?.asMilliseconds());
    });
    return delayed;
  }

  /**
   * Creates a signal from a promise.
   *
   * This function takes a promise and returns a signal that updates with the
   * resolved value of the promise.
   * Initially, the signal holds `undefined`.
   * When the promise resolves, the signal updates with the mapped value.
   *
   * This can very useful when working with API services which often return
   * promises.
   *
   * @param map A mapping function to transform the resolved value before
   *            storing it in the signal.
   *            Defaults to an identity function.
   *
   * @example
   * const mySignal = signals.fromPromise(fetchData());
   *
   * effect(() => {
   *   console.log(mySignal()); // Initially undefined, then updates with resolved value.
   * });
   *
   * @example
   * // Using a mapping function
   * const userSignal = signals.fromPromise(fetchUser(), user => user.name);
   */
  export function fromPromise<T, U = T>(
    promise: Promise<T>,
    map: (value: T) => U = value => value as unknown as U,
  ): Signal<undefined | U> {
    let mapped = signal<undefined | U>(undefined);
    promise.then(value => mapped.set(map(value)));
    return mapped;
  }
}
