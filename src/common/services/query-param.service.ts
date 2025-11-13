import {computed, inject, Injectable, Signal} from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import {ActivatedRoute, Params, Router} from "@angular/router";

// prettier-ignore
@Injectable({
  providedIn: "root",
})
export class QueryParamService {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private queryParamMap = toSignal(this.route.queryParamMap);

  // no options -> single string or undefined
  signal(param: string): QueryParamSignal<string | undefined>;

  // string
  signal(param: string, options: { multi: true; default?: string[] }): QueryParamSignal<string[]>;
  signal(param: string, options: { multi?: false; default: string }): QueryParamSignal<string>;
  signal(param: string, options: { multi?: false }): QueryParamSignal<string | undefined>;

  // generic parsed types
  signal<T>(param: string, options: { parse: (raw: string) => T; serialize: (value: T) => string }): QueryParamSignal<T | undefined>;
  signal<T>(param: string, options: { multi: true; parse: (raw: string) => T; serialize: (value: T) => string; default?: T[] }): QueryParamSignal<T[]>;
  signal<T>(param: string, options: { multi?: false; default: T; parse: (raw: string) => T; serialize: (value: T) => string }): QueryParamSignal<T>;

  // general catch-all, must be supertype of all above
  signal<T>(
    param: string,
    options?: {
      multi?: boolean;
      default?: T | T[];
      parse?: (raw: string) => T;
      serialize?: (value: T) => string;
    }
  ): QueryParamSignal<string | string [] | T | T[] | undefined> {
    let read = computed(() => {
      let params = this.queryParamMap();
      if (!params || !params.has(param)) {
        if (options?.default) return options.default;
        if (options?.multi) return [];
        return undefined;
      }
      if (options?.multi) {
        let values = params.getAll(param);
        if (options?.parse) return values.map(options.parse);
        return values;
      }
      let value = params.get(param);
      if (value == null) return options?.default;
      if (options?.parse) return options.parse(value);
      return value;
    });

    let set = (value: T | T[]) => {
      let queryParams: Params = {[param]: value}; 
      if (options?.serialize) {
        if (Array.isArray(value)) queryParams[param] = value.map(options.serialize);
        else queryParams[param] = options.serialize(value);
      }

      return this.router.navigate([], {
        queryParams, 
        queryParamsHandling: "merge", 
        replaceUrl: true
      });
    };
    
    return Object.assign(read, {set});
  }
}

type QueryParamSignal<T> = Signal<T> & {
  set(value: T): Promise<boolean>;
};

export namespace QueryParamService {
  export type Signal<T> = QueryParamSignal<T>;
}
