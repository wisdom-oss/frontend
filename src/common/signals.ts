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
  export type ToggleableSignal<S extends WritableSignal<boolean>> = S & {
    toggle(): void;
  }
  
  export function toggleable(initial: boolean): ToggleableSignal<WritableSignal<boolean>>;
  export function toggleable<S extends WritableSignal<boolean>>(initial: S): ToggleableSignal<S>; 
  export function toggleable<S extends WritableSignal<boolean>>(initial: boolean | S) {
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
