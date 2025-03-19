import {effect, inject, signal, Signal, WritableSignal} from "@angular/core";
import {toSignal} from "@angular/core/rxjs-interop";
import {FormControl} from "@angular/forms";
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
   * A specialized signal for managing a set of unique values.
   *
   * Unlike using a {@link WritableSignal<Set<T>>}, this signal provides
   * built-in methods for adding, deleting, and clearing values without
   * requiring explicit updates.
   *
   * @template T The type of values stored in the set.
   */
  export type SetSignal<T> = Signal<Set<T>> & {
    /**
     * Adds a value to the set.
     *
     * Notifies only if the set did not have the provided value.
     */
    add(value: T): Set<T>;

    /**
     * Clears all values from the set.
     *
     * Notifies only if the set was not already empty.
     */
    clear(): void;

    /**
     * Deletes a value from the set.
     *
     * Notifies only if the value was actually removed.
     *
     * @returns `true` if the value was removed, `false` if it was not in the set.
     */
    delete(value: T): boolean;
  };

  /**
   * Creates a `SetSignal`, a signal that manages a `Set<T>` efficiently.
   *
   * Unlike a {@link WritableSignal<Set<T>>}, which requires manually
   * calling a signal update when modifying it, this signal provides built-in
   * `add`, `delete`, and `clear` methods that only notify subscribers when the
   * set actually changes.
   *
   * @template T The type of values stored in the set.
   * @param iterable (Optional) Initial values for the set.
   *
   * @example
   * // Creating an empty set signal
   * const mySet = signals.set<number>();
   *
   * mySet.add(5); // Adds 5 and notifies
   * console.log(mySet()); // Set { 5 }
   *
   * mySet.add(5); // No notification, since 5 is already in the set
   *
   * // Creating a set with initial values
   * const mySetWithValues = signals.set(["apple", "banana"]);
   * mySetWithValues.delete("banana"); // Removes "banana" and notifies
   * mySetWithValues.delete("banana"); // No notification, since "banana" was already removed
   * console.log(mySetWithValues()); // Set { "apple" }
   */
  export function set<T>(iterable?: Iterable<T>): SetSignal<T> {
    let inner = new Set(iterable);
    // Since we do not expose `set` or `update`, all updates are intentional.
    // This ensures that notifications only occur on actual set changes.
    let s = signal(inner, {equal: () => false});

    return Object.assign(s, {
      add(value: T) {
        if (inner.has(value)) return inner; // No change, no notification
        let result = inner.add(value);
        s.set(inner); // Notify only on actual addition
        return result;
      },
      clear() {
        if (inner.size === 0) return; // No change, no notification
        inner.clear();
        s.set(inner); // Notify only if set was not empty
      },
      delete(value: T) {
        let result = inner.delete(value);
        if (result) s.set(inner); // Notify only on actual removal
        return result;
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

  /**
   * A signal that wraps an Angular `FormControl`.
   *
   * This signal provides reactive access to the form control's value
   * and allows updating it directly.
   *
   * @example
   * const mySignal = signals.formControl<string>("");
   *
   * // Reading the current value
   * console.log(mySignal()); // ""
   *
   * // Updating the value
   * mySignal.set("new value");
   *
   * // Using in a template with Angular's form control directive:
   * ```html
   * <input [formControl]="mySignal.formControl">
   * ```
   */
  export type FormControlSignal<T> = Signal<T> & {
    /**
     * The associated `FormControl` instance.
     *
     * This can be used in templates via the `[formControl]` directive.
     */
    formControl: FormControl<T>;

    /**
     * Updates the value of the form control.
     *
     * This is equivalent to calling `setValue` on the underlying `FormControl`.
     *
     * @param value The new value to set.
     */
    set(value: T): void;
  };

  /**
   * Creates a `FormControlSignal` from an initial value.
   *
   * This function returns a signal that is linked to an Angular
   * {@link FormControl}, allowing seamless two-way binding with form inputs.
   * Ensure you have the `ReactiveFormsModule` imported.
   *
   * @example
   * const mySignal = signals.formControl<string>("default");
   *
   * // Using in a component template:
   * ```html
   * <input [formControl]="mySignal.formControl">
   * ```
   */
  export function formControl<T>(initialValue: T): FormControlSignal<T> {
    let inner = new FormControl(initialValue) as FormControl<T>;
    let s = toSignal(inner.valueChanges, {initialValue});
    return Object.assign(s, {
      formControl: inner,
      set(value: T) {
        inner.setValue(value);
      },
    });
  }
}
