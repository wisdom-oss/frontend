import {
  httpResource,
  HttpStatusCode,
  HttpContext,
  HttpResourceFn,
  HttpResourceOptions,
  HttpParams,
  HttpResourceRef,
  HttpResourceRequest,
  HttpErrorResponse,
} from "@angular/common/http";
import {computed, isSignal, Signal as CoreSignal} from "@angular/core";
import {Duration} from "dayjs/plugin/duration";
import typia from "typia";

import {httpContexts} from "./http-contexts";

export namespace api {
  /**
   * A request signal, this may be any raw value or a signal that may produce 
   * this value.
   * 
   * This should be used in API services for their parameters.
   * Using them allows callers of API services to provide signal that are 
   * reactions to user input or otherwise delayed data.
   * Signals themselves could also be used to update the request without having 
   * to call the api method again.
   */
  export type RequestSignal<T> = T | CoreSignal<T | undefined>;

  /**
   * Function to ensure that a {@link RequestSignal} is actually a signal.
   * 
   * It is easier to work with a request signal, if it known that we actually 
   * have signals.
   * To accommodate this, we just promote any raw value into a signal.
   */
  export function toSignal<T>(
    input: RequestSignal<T>,
  ): CoreSignal<T | undefined> {
    if (isSignal(input)) return input;
    return computed(() => input);
  }

  /**
   * The namespaced signal type.
   * 
   * This should be the output of any API service method.
   * It itself is a signal and can be called to the current value while it also 
   * contains the original {@link HttpResourceRef} that is the underlying 
   * implementation.
   * 
   * Accessing the actual value should *only* be done via calling this signal 
   * directly and **not** via `.resource.value()`.
   */
  export type Signal<T, D = undefined> = CoreSignal<T | D> & {
    resource: HttpResourceRef<T | D>;
  };

  /**
   * An explicit unset value.
   * 
   * The options of {@link resource} expect that each provided signal returns 
   * anything other than `undefined` when it's ready.
   * This will block the option to provide the `undefined` value as an output 
   * for a signal.
   * To alleviate that very specific and niche issue, this symbol should be used 
   * instead.
   * It will be converted to an `undefined` but after the initial check if the 
   * signal provided a value.
   */
  export const NONE = Symbol("api.NONE");
  export type NONE = typeof NONE;

  type Request = {
    [K in keyof Omit<
      HttpResourceRequest,
      "method" | "context" | "withCredentials" | "transferCache"
    >]: RequestSignal<HttpResourceRequest[K]>;
  };

  type Options<TResult, TRaw> = Omit<
    HttpResourceOptions<TResult, TRaw>,
    "defaultValue" | "injector"
  >;

  type ResourceParams<
    TResult,
    TRaw,
    TDefault extends TResult | undefined,
  > = Request &
    Options<TResult, TRaw> & {
      validate: (input: unknown) => typia.IValidation<TResult>;
      method?: "GET" | "POST";
      responseType?: "arrayBuffer" | "blob" | "text";
      validateRaw?: (input: unknown) => typia.IValidation<TRaw>;
      defaultValue?: TDefault;
      authenticate?: boolean;
      cache?: Duration;
      onError?: Partial<
        Record<HttpStatusCode, (err: HttpErrorResponse) => TResult>
      >;
    };

  /**
   * Our custom extension of the {@link httpResource}.
   * 
   * All API services should use this function if possible to define their 
   * interaction with the http client.
   * This function abstracts over the Angular provided {@link httpResource} 
   * function to provide extra care for our typically used options.
   * Instead of two parameters, we just use one parameter containing everything.
   * 
   * @param options
   * The options that will be extracted into {@link HttpResourceRequest}, 
   * {@link HttpResourceOptions} and our own fields.
   * All options that allow passing in an {@link RequestSignal} are expected to 
   * return anything other than `undefined` when they're ready.
   * Passing a direct `undefined` or not passing that field into the `options`,
   * will simply ignore that field.
   * If you *need* to use an `undefined` in the underlying {@link httpResource}, 
   * check out {@link NONE}.
   * 
   * @param options.url 
   * The URL of the request, see {@link url} to make building them easier.
   * 
   * @param options.validate
   * A {@link typia}-created type validator that will be used to verify that the 
   * output type is the expected type.
   * If the `TResult` type is not what the service responds, use the `parse` 
   * option to provide a parser from `TRaw` to `TResult`.
   * 
   * @param options.method 
   * The URL method. By default is "GET" used.
   * 
   * @param options.parse
   * A function to parse the `TRaw` into a `TResult`.
   * The parsed output is still verified via the `validate` option.
   * If you want to type check the `TRaw` type coming into your parser use the 
   * `validateRaw` option.
   * 
   * @param options.validateRaw
   * 
   * 
   * @returns A request signal which acts like a regular {@link CoreSignal}.
   */
   // TODO: continue this doc
  export function resource<
    TResult,
    TRaw = TResult,
    TDefault extends TResult | undefined = undefined,
  >(
    options: ResourceParams<TResult, TRaw, TDefault>,
  ): Signal<TResult, NoInfer<TDefault>> {
    let {
      responseType,
      equal,
      validate,
      validateRaw,
      defaultValue,
      authenticate,
      cache,
      onError,
    } = options;

    let httpContext = computed(() => {
      let context = new HttpContext().set(
        httpContexts.authenticate,
        authenticate,
      );
      if (cache !== undefined) {
        let {url, params, body} = options;
        let cacheKey = JSON.stringify(
          {
            url: isSignal(url) ? url() : url,
            params: isSignal(params) ? params() : params,
            body: isSignal(body) ? body() : body,
          },
          (_, value) => {
            if (value instanceof HttpParams) return value.toString();
            if (value instanceof FormData) return Array.from(value.entries());
            return value;
          },
        );
        context = context.set(httpContexts.cache, [cacheKey, cache]);
      }
      return context;
    });

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
      let context = httpContext();

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

      return {context, ...request};
    });

    // This is the parse function we throw on every http resource, for all
    // request it will run the type validator to check if the response has the
    // correct type.
    // If the user provided its own parse function, we run that on the original
    // result as it would be usually the case on http resources.
    // When a validateRaw is provided we test the raw response type.
    // This way we can ensure that the parse function acts correctly on its
    // types.
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

    let httpResourceF = (() => {
      // prettier-ignore
      switch (responseType) {
        case undefined: return httpResource<TResult>;
        case "text": return httpResource.text;
        case "arrayBuffer": return httpResource.arrayBuffer;
        case "blob": return httpResource.blob;
      }
    })() as HttpResourceFn;
    let resourceRef = httpResourceF(
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

  /**
   * Map a {@link RequestSignal} via a mapping function.
   *
   * This makes it more simple to handle the type union that is a
   * {@link RequestSignal}.
   * If you have a value, it will be mapped, no matter if the input is a signal
   * or not.
   * The mapping function `f` will *only* not be called if the output of the
   * signal variant is `undefined`.
   */
  export function map<T, U>(
    request: RequestSignal<T>,
    f: (raw: T) => U,
  ): RequestSignal<U> {
    if (!isSignal(request)) return f(request);
    return computed(() => {
      let value = request();
      if (value === undefined) return undefined;
      return f(value);
    });
  }
}
