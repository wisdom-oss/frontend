import {computed, inject, Injectable, Signal} from "@angular/core";
import {toSignal} from "@angular/core/rxjs-interop";
import {Params, ActivatedRoute, Router} from "@angular/router";

interface Options<T> {
  /** When true, the query parameter is treated as a list and reads and writes use arrays. */
  multi?: boolean;

  /** Default value returned when the query parameter is missing in the url. */
  default?: T | T[];

  /** Parses the raw query string value into the generic type `T`. */
  parse: (raw: string) => T;

  /** Serializes a value of `T` into a string for storing in the query parameter. */
  serialize: (value: T) => string;
}

type MultiOpts<T> = Pick<Options<T>, "multi" | "default"> & {
  multi: true;
  default?: T[];
  parse?: never;
  serialize?: never;
};

type DefaultOpts<T> = Pick<Options<T>, "multi" | "default"> & {
  multi?: false;
  default: T;
  parse?: never;
  serialize?: never;
};

type MinimalOpts = Pick<Options<void>, "multi"> & {multi?: false};

type ComplexOpts<T> = Pick<Options<T>, "parse" | "serialize">;

type MultiComplexOpts<T> = Options<T> & {multi: true; default?: T[]};

type DefaultComplexOpts<T> = Options<T> & {multi?: false; default: T};

// prettier-ignore
/**
 * Service for reading and writing query parameters as Angular signals.
 *
 * The main entry point is {@link QueryParamService.signal}, which binds a signal
 * to a query parameter and keeps component state and the url in sync.
 */
@Injectable({
  providedIn: "root",
})
export class QueryParamService {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private queryParamMap = toSignal(this.route.queryParamMap);

  // no options -> single string or undefined
  /**
   * Creates a signal bound to a query parameter.
   *
   * The signal reads the current value from the url and writes by navigating with
   * updated query parameters. This lets components keep their state in sync with
   * the url and makes it easy to store filters or other state in the query string.
   *
   * When `options.multi` is true, the parameter is handled as a list. When
   * `options.parse` or `options.serialize` is set, the value is converted between
   * strings and the generic type `T`.
   * 
   * @example
   * ```ts
   * const query = inject(QueryParamService);
   *
   * // page is kept in sync with the ?page= query parameter
   * const page = query.signal("page", {
   *   default: 1,
   *   parse: raw => Number.parseInt(raw, 10),
   *   serialize: v => String(v),
   * });
   *
   * // read current page
   * console.log(page());
   *
   * // increase page and update the url
   * page.set(page() + 1);
   * ```
   *
   * @typeParam T Type of the parsed value.
   * @param param Name of the query parameter.
   * @param options Behavior for multi values, defaults, parsing, and serialization.
   */
  signal(param: string): QueryParamSignal<string | undefined>;

  // generic parsed types
  signal<T>(param: string, options: ComplexOpts<T>): QueryParamSignal<T | undefined>;
  signal<T>(param: string, options: MultiComplexOpts<T>): QueryParamSignal<T[]>;
  signal<T>(param: string, options: DefaultComplexOpts<T>): QueryParamSignal<T>;

  // string
  signal(param: string, options: MultiOpts<string>): QueryParamSignal<string[]>;
  signal(param: string, options: DefaultOpts<string>): QueryParamSignal<string>;
  signal(param: string, options: MinimalOpts): QueryParamSignal<string | undefined>;

  // general catch-all, must be supertype of all above
  signal<T>(
    param: string,
    options?: Partial<Options<T>>
  ): QueryParamSignal<string | string [] | T | T[] | undefined> {
    let read = computed(() => {
      let params = this.queryParamMap();
      if (!params || !params.has(param)) {
        if (options && "default" in options) return options.default;
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
      if (value && options?.serialize) {
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

/**
 * Signal that is bound to a query parameter.
 *
 * Reading returns the current (optionally parsed) value from the url.
 * Writing updates the query parameter and triggers a router navigation.
 */
type QueryParamSignal<T> = Signal<T> & {
  /**
   * Updates the bound query parameter in the url.
   *
   * This triggers a router navigation, so the signal value is not updated instantly.
   *
   * @param value New value to write to the query parameter.
   * @returns Promise that resolves to the result of the navigation.
   */
  set(value: T): Promise<boolean>;
};

export namespace QueryParamService {
  export type Signal<T> = QueryParamSignal<T>;
}
