import {signal, WritableSignal} from "@angular/core";

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
}
