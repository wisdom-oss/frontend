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
  export interface ToggleableSignal extends WritableSignal<boolean> {
    toggle(): () => {};
  }

  export function toggleable(initialValue: boolean): ToggleableSignal {
    let s = signal(initialValue);
    return Object.defineProperty(s, "toggle", {
      writable: false,
      value: () => {
        let value = s();
        s.set(!value);
      },
    }) as ToggleableSignal;
  }
}
