import {inject, makeEnvironmentProviders} from "@angular/core";
import {toSignal} from "@angular/core/rxjs-interop";
import {TranslateService} from "@ngx-translate/core";
import {map} from "rxjs";

import {injections} from "../../common/injections";

/**
 * Provides the language signal for dependency injection.
 *
 * This function registers a signal that reflects the currently active language
 * from {@link TranslateService}.
 * The signal updates automatically when the language changes.
 */
export const provideLangSignal = () =>
  makeEnvironmentProviders([
    {
      provide: injections.LANG_SIGNAL,
      useFactory: () => {
        let translate = inject(TranslateService);
        return toSignal(translate.onLangChange.pipe(map(event => event.lang)), {
          initialValue: translate.getCurrentLang(),
        });
      },
    },
  ]);
