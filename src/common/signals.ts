import {
  computed,
  effect,
  inject,
  signal,
  CreateSignalOptions,
  Signal,
  WritableSignal,
} from "@angular/core";
import {toSignal} from "@angular/core/rxjs-interop";
import {FormControl} from "@angular/forms";
import dayjs, {Dayjs, ConfigType, OptionType} from "dayjs";
import {Duration} from "dayjs/plugin/duration";

import {injections} from "./injections";
import {typeUtils} from "./utils/type-utils";
import {omit} from "./utils/omit";

const makeDayjs = dayjs;

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
  export type ToggleableSignal<
    S extends WritableSignal<boolean> = WritableSignal<boolean>,
  > = S & {
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
   * A signal around a mutable array with helper methods.
   *
   * You always get the same underlying array instance and we mutate it in place.
   * If you keep a reference like `const ref = arr()`, later pushes and pops will
   * change that same array.
   * If you need a stable snapshot, clone it.
   *
   * Do not mutate the returned array directly.
   * That will not notify dependents.
   * Use `push`, `pop`, and `clear` so the signal updates correctly.
   *
   * Reading the length works as `array().length`.
   *
   * @template T Element type.
   *
   * @example
   * const items = signals.array<number>([1]);
   * items.push(2);
   * console.log(items());        // [1, 2]
   * console.log(items().length); // 2
   * items.pop();                 // removes 2 and notifies
   * items.clear();               // [] and notifies
   *
   * @example
   * // Live reference vs snapshot
   * const live = items();      // live reference to the same array
   * const snap = [...items()]; // snapshot copy
   * items.push(3);
   * console.log(live); // [3]
   * console.log(snap); // []
   */
  export type ArraySignal<T> = Signal<readonly T[]> & {
    push(item: T): void;
    pop(): T | undefined;
    clear(): void;
  };

  /**
   * Creates an {@link ArraySignal}.
   *
   * The stored array is mutated in place.
   *
   * You always get the same array instance from the getter.
   * Do not mutate it directly, since that will not trigger updates.
   * Always use `push`, `pop`, or `clear` so subscribers update.
   *
   * Reading length works as `array().length`.
   *
   * @template T Element type.
   * @param iterable Optional initial values.
   * @returns A signal with array helpers.
   *
   * @example
   * const letters = signals.array(["a"]);
   * letters.push("b");
   * console.log(letters());        // ["a", "b"]
   * console.log(letters().length); // 2
   *
   * @example
   * // Do not mutate the returned array directly
   * const arrRef = letters();
   * // arrRef.push("x"); // avoid, this will not notify
   * letters.push("x");    // do this instead
   */
  export function array<T>(iterable?: Iterable<T>): ArraySignal<T> {
    let inner = Array.from(iterable ?? []);
    let innerSignal = signal(inner, {equal: () => false});

    let push = (item: T): void => {
      inner.push(item);
      innerSignal.set(inner);
    };

    let pop = (): T | undefined => {
      let value = inner.pop();
      innerSignal.set(inner);
      return value;
    };

    let clear = (): void => {
      inner.length = 0;
      innerSignal.set(inner);
    };

    return Object.assign(innerSignal, {push, pop, clear});
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
    promise: PromiseLike<T>,
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

  /**
   * Creates a signal that produces a `Dayjs` object from a reactive config source.
   *
   * Similar to `computed`, this function takes a reactive getter.
   * But instead of returning a `Dayjs` object directly, you return a
   * config value (like a date string or timestamp), which will be
   * parsed into a `Dayjs` instance.
   *
   * If the config is `null` or `undefined`, the signal returns `undefined`.
   *
   * @param loader A function returning a `dayjs`-compatible config (`string`, `Date`, etc.)
   * @param format Optional format to use when parsing
   *
   * @example
   * const birthday = signals.dayjs(() => user().birthday);
   * console.log(birthday()); // Dayjs or undefined
   *
   * @see https://day.js.org/docs/en/parse/parse for supported input types and formats
   */
  export function dayjs(
    loader: () => ConfigType,
    format?: OptionType,
  ): Signal<undefined | Dayjs> {
    let configSignal = computed(loader);
    return computed(() => {
      let config = configSignal();
      if (!config) return undefined;
      return makeDayjs(config, format);
    });
  }

  /**
   * Like `signals.dayjs`, but config must never be `null` or `undefined`.
   *
   * You give it a reactive function returning a valid config,
   * and it gives back a signal with a guaranteed `Dayjs` object.
   *
   * @param loader A function returning a non-null Dayjs config
   * @param format Optional format to use when parsing
   *
   * @example
   * const createdAt = signals.dayjs.required(() => record().created);
   * console.log(createdAt()); // Always a Dayjs
   *
   * @see https://day.js.org/docs/en/parse/parse for supported input types and formats
   */
  export namespace dayjs {
    export function required(
      loader: () => Exclude<ConfigType, null | undefined>,
      format?: OptionType,
    ): Signal<Dayjs> {
      let configSignal = computed(loader);
      return computed(() => makeDayjs(configSignal(), format));
    }
  }

  /**
   * Creates a writable signal that mirrors the negation of another boolean signal.
   *
   * The returned signal always reflects the opposite of the `inner` signal.
   * Setting it will invert the given value and update the original signal.
   *
   * Useful when you want a toggled view of some state (e.g. `!isVisible`).
   *
   * @param inner A `WritableSignal<boolean>` to mirror in inverted form.
   * @returns A writable signal with inverted logic.
   *
   * @example
   * const visible = signal(true);
   * const hidden = signals.not(visible);
   *
   * hidden(); // false
   * hidden.set(true); // sets visible to false
   * console.log(visible()); // false
   */
  export function not(inner: WritableSignal<boolean>): WritableSignal<boolean> {
    let get = () => !inner();
    let set = (value: boolean) => inner.set(!value);
    return Object.assign(get, inner, {set});
  }

  /**
   * Derives a new signal by mapping the value of another signal.
   *
   * We read `input()` and return `transform(input())`. The result updates
   * whenever `input` changes. This is a thin wrapper over `computed`.
   *
   * @template T Input value type.
   * @template U Output value type.
   * @param input Source signal.
   * @param transform Pure mapping function from T to U.
   * @returns A read-only signal of the mapped value.
   *
   * @example
   * const count = signal(2);
   * const doubled = signals.map(count, n => n * 2);
   * doubled(); // 4
   *
   * @example
   * // Map an optional value to a fallback
   * const maybeName = signals.maybe<string>();
   * const label = signals.map(maybeName, n => n ?? "unknown");
   */
  export function map<T, U>(
    input: Signal<T>,
    transform: (value: T) => U,
  ): Signal<U> {
    return computed(() => transform(input()));
  }

  /**
   * Creates a writable signal that may hold `undefined`.
   *
   * This is useful for optional values where the signal might be unset
   * at first and filled later. It works like `signal<T | undefined>` but
   * with a shorthand `initial` option.
   *
   * @template T Value type.
   * @param options Optional settings, including `initial` for an initial value.
   *                Other `CreateSignalOptions` are passed through.
   * @returns A writable signal of type `T | undefined`.
   *
   * @example
   * // Empty at first
   * const name = signals.maybe<string>();
   * console.log(name()); // undefined
   * name.set("Alice");
   * console.log(name()); // "Alice"
   *
   * @example
   * // With an initial value
   * const age = signals.maybe<number>({ initial: 18 });
   * console.log(age()); // 18
   */
  export function maybe<T>(
    options?: CreateSignalOptions<T | undefined> & {initial?: T},
  ): WritableSignal<undefined | T> {
    return signal<undefined | T>(
      options?.initial,
      options ? omit(options, "initial") : undefined,
    );
  }

  /**
   * Requires all given signals to have acceptable values.
   *
   * We pass a record of signals. If any current value is in `exclude`, we return
   * `fallback` instead. Otherwise we return an object with the unwrapped values.
   *
   * By default, `exclude` is `[undefined]`.
   *
   * Short circuits on the first excluded value. Recomputes when any input signal changes.
   *
   * All generic types are inferred from the function arguments.
   * Manually specifying them is almost always an error.
   *
   * @template R The input record of signals. Keys are preserved and each value is a `Signal`.
   * @template F The fallback value if any input is excluded. Inferred from `options.fallback`. Defaults to `undefined`.
   * @template E The union of values treated as excluded. Inferred from `options.exclude`. Defaults to `undefined`.
   *
   * @param record A record of input signals.
   * @param options Optional settings.
   * @param options.fallback Value to return when at least one input is excluded. Defaults to `undefined`.
   * @param options.exclude Values that count as missing. Defaults to `[undefined]`.
   * @returns A signal with either the unwrapped record or the fallback:
   *          `Signal<{[K in keyof R]: Exclude<typeUtils.Signaled<R[K]>, E>} | F>`
   *
   * @example
   * // Basic: require that both signals are defined
   * const a = signals.maybe<number>();
   * const b = signals.maybe<string>();
   * const both = signals.require({ a, b });
   * effect(() => {
   *   const v = both();
   *   if (v !== undefined) {
   *     // v.a: number, v.b: string
   *   }
   * });
   *
   * @example
   * // With a fallback object
   * const userId = signals.maybe<string>();
   * const token = signals.maybe<string>();
   * const ready = signals.require(
   *   { userId, token },
   *   { fallback: { status: 'missing' } as const },
   * );
   * // Signal<{ userId: string; token: string } | { status: 'missing' }>
   *
   * @example
   * // Treat null and undefined as missing
   * const name = signals.maybe<string | null>();
   * const age = signals.maybe<number | null>();
   * const present = signals.require(
   *   { name, age },
   *   { exclude: [null, undefined] },
   * );
   *
   * @example
   * // Exclude a sentinel value
   * const step = signal<number>(0);
   * const ok = signals.require(
   *   { step },
   *   { exclude: [0], fallback: 'not ready' },
   * );
   */
  export function require<
    R extends Record<string, Signal<any>>,
    F = undefined,
    E = undefined,
  >(
    record: R,
    options?: {fallback?: F; exclude?: readonly E[]},
  ): Signal<{[K in keyof R]: Exclude<typeUtils.Signaled<R[K]>, E>} | F> {
    return computed(() => {
      const output: Record<string, any> = {};
      for (const [key, value] of Object.entries(record)) {
        const signaled = value();
        if ((options?.exclude ?? [undefined]).includes(signaled as any)) {
          return (options?.fallback ?? undefined) as F;
        }
        output[key] = signaled;
      }
      return output as {[K in keyof R]: Exclude<typeUtils.Signaled<R[K]>, E>};
    });
  }

  /**
   * A signal that carries no data and only notifies dependents when triggered.
   *
   * Use this when we want to kick off a recomputation manually
   * (e.g. button click), without passing any payload.
   *
   * The signal's value type is `void`. It is not meant to be read for data.
   *
   * @note This should never be used directly in API services.
   *       It is meant for components only.
   *       If you want to retrigger resources based on this, wrap it in
   *       a `computed` that listens to this signal and use that to request
   *       the service.
   *
   * @example
   * // Create a trigger and a derived computation that reruns on trigger
   * const refresh = signals.trigger();
   * const time = computed(() => {
   *   // depends on refresh; recomputes whenever we call refresh.trigger()
   *   refresh();
   *   return Date.now();
   * });
   *
   * // Later, from a button or elsewhere:
   * refresh.trigger(); // forces `time` to recompute
   */
  export type TriggerSignal = Signal<void> & {
    /**
     * Notifies subscribers and causes dependents to recompute.
     * Does not carry or change any value.
     */
    trigger(): void;
  };

  /**
   * Creates a {@link TriggerSignal}.
   *
   * The returned signal has a `trigger()` method that fires an update.
   * It does not hold state and does not deliver a payload.
   *
   * @note This should never be used directly in API services.
   *       It is meant for components only.
   *       If you want to retrigger resources based on this, wrap it in
   *       a `computed` that listens to this signal and use that to request
   *       the service.
   *
   * @returns A signal that we can trigger manually.
   *
   * @example
   * const refresh = signals.trigger();
   *
   * effect(() => {
   *   refresh();            // establish dependency
   *   console.log("run");   // runs each time we call refresh.trigger()
   * });
   *
   * // In a component template:
   * // <button (click)="refresh.trigger()">Refresh</button>
   */
  export function trigger(): TriggerSignal {
    let inner = signal(null, {equal: () => false});
    let trigger = () => inner.set(null);
    return Object.assign(inner as unknown as Signal<void>, {trigger});
  }
}
