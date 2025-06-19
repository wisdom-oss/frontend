import {
  httpResource,
  HttpStatusCode,
  HttpContext,
  HttpResourceOptions,
  HttpResourceRef,
  HttpResourceRequest,
  HttpErrorResponse,
} from "@angular/common/http";
import {computed, isSignal, Signal as CoreSignal} from "@angular/core";
import {Duration} from "dayjs/plugin/duration";
import typia from "typia";

import {httpContexts} from "./http-contexts";

export namespace api {
  export type RequestSignal<T> = T | CoreSignal<T | undefined>;

  export function toSignal<T>(
    input: RequestSignal<T>,
  ): CoreSignal<T | undefined> {
    if (isSignal(input)) return input;
    return computed(() => input);
  }

  export type Signal<T, D = undefined> = CoreSignal<T | D> & {
    resource: HttpResourceRef<T | D>;
  };

  /** DOC HERE */
  export const NONE = Symbol("api.NONE");
  export type NONE = typeof NONE;

  type Request = {
    [K in keyof Omit<
      HttpResourceRequest,
      "context" | "withCredentials" | "transferCache"
    >]: RequestSignal<HttpResourceRequest[K]>;
  };

  type Options<TResult, TRaw> = Omit<
    HttpResourceOptions<TResult, TRaw>,
    "defaultValue" | "injector"
  >;

  export function resource<
    TResult,
    TRaw = TResult,
    TDefault extends TResult | undefined = undefined,
  >(
    options: Request &
      Options<TResult, TRaw> & {
        validate: (input: unknown) => typia.IValidation<TResult>;
        validateRaw?: (input: unknown) => typia.IValidation<TRaw>;
        defaultValue?: TDefault;
        authenticate?: boolean;
        cache?: Duration;
        onError?: Partial<
          Record<HttpStatusCode, (err: HttpErrorResponse) => TResult>
        >;
      },
  ): Signal<TResult, NoInfer<TDefault>> {
    let {
      equal,
      validate,
      validateRaw,
      defaultValue,
      authenticate,
      cache,
      onError,
    } = options;

    let context = new HttpContext().set(
      httpContexts.authenticate,
      authenticate,
    );
    if (cache !== undefined) {
      let {url, params, body} = options;
      let cacheKey = JSON.stringify({url, params, body});
      context = context.set(httpContexts.cache, [cacheKey, cache]);
    }

    // Heads up: this signal is subtle and a bit delicate.
    // The key idea is that the caller stays in control of the request.
    // If a value is passed directly (even undefined), we use it as-is.
    // But if a signal is passed and *its value* is undefined, we bail out early.
    // That way, signals that aren't ready yet (like async data) delay the request,
    // while static undefineds just fall through and let the resource use defaults.
    // Once all signal values are ready, we build the request.
    let resourceRequest = computed((): HttpResourceRequest | undefined => {
      // TODO: explain that you can use api.NONE to send undefined
      let url = isSignal(options.url) ? options.url() : options.url;
      if (url === undefined) return undefined;

      let request: HttpResourceRequest = {url};
      for (let key of [
        "method",
        "body",
        "params",
        "headers",
        "reportProgress",
      ] as const) {
        if (isSignal(options[key])) {
          let value = options[key]();
          if (value === undefined) return undefined;
          // @ts-ignore that type inference here is too complex
          request[key] = value === NONE ? undefined : value;
          continue;
        }

        // @ts-ignore here too
        request[key] = options[key];
      }

      return request;
    });

    let parse = (raw: TRaw): TResult => {
      let result = raw as unknown as TResult;
      if (options.parse) {
        if (validateRaw) {
          let validRaw = validateRaw(raw);
          if (!validRaw.success) {
            console.error(validRaw.errors);
            throw new Error("Invalid type on raw response");
          }
        }

        result = options.parse(raw);
      }

      let validResult = validate(result);
      if (!validResult.success) {
        console.error(validResult.errors);
        throw new Error("Invalid type on response");
      }

      return result;
    };

    let resourceOptions: HttpResourceOptions<TResult, TRaw> = {
      parse,
      defaultValue,
      equal,
    };

    let resourceRef = httpResource<TResult>(
      resourceRequest,
      resourceOptions as HttpResourceOptions<TResult, unknown>,
    ) as HttpResourceRef<TResult | TDefault>;

    let value = computed(() => {
      let error = resourceRef.error();
      if (error && error instanceof HttpErrorResponse) {
        let handler = onError?.[error.status as HttpStatusCode];
        if (handler) return handler(error);
      }

      return resourceRef.value();
    });

    return Object.assign(value, {resource: resourceRef});
  }

  export function url(
    template: TemplateStringsArray,
    ...args: RequestSignal<string | number | boolean>[]
  ): CoreSignal<string | undefined> {
    return computed(() => {
      let url = template[0];
      for (let i in args) {
        let arg = toSignal(args[i])();
        if (arg === undefined) return undefined;
        url += arg + template[+i + 1];
      }
      return url;
    });
  }

  export function map<T, U>(request: RequestSignal<T>, f: (raw: T) => U): RequestSignal<U> {
    if (!isSignal(request)) return f(request);
    return computed(() => {
      let value = request();
      if (value === undefined) return undefined;
      return f(value);
    });
  }
}
