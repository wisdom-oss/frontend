// eslint-disable no-unused-vars

import {Signal, InjectionToken} from "@angular/core";

import type {signals} from "./signals";
import type {provideLangSignal} from "../core/providers/lang-signal.provider";

/**
 * Injection tokens for dependency injection.
 *
 * This namespace contains various tokens that can be used to provide and
 * inject specific dependencies in the application.
 */
export namespace injections {
  /**
   * Injection token for the active language signal.
   *
   * @see signals.lang
   * @see provideLangSignal
   */
  export const LANG_SIGNAL = new InjectionToken<Signal<"en" | "de">>(
    "LANG_SIGNAL",
  );
}
