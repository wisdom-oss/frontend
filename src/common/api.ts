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

/**
 * Utilities to build API services.
 * 
 * All our services in `/src/api/` should make heavily use of this namespace to 
 * build methods that use {@link api.RequestSignal} as parameters and 
 * {@link api.Signal} as return values while internally using 
 * {@link api.resource}.
 * 
 * Things like {@link api.url} and {@link api.map} help with handling the 
 * {@link api.RequestSignal}s.
 * 
 * All future services should heavily set on the tools provided in this 
 * namespace rather than raw-dogging Angular's {@link httpResource} as our 
 * provided functions ensure consistency of the WISdoM platform and provide ease 
 * of use for things like authentication, type validation or caching.
 */
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

  /**
   * The option for a {@link resource}.
   * 
   * These options will be extracted into {@link HttpResourceRequest}, 
   * {@link HttpResourceOptions} and our own fields.
   * 
   * All options that allow passing in an {@link RequestSignal} are expected to 
   * return anything other than `undefined` when they're ready.
   * Passing a direct `undefined` or not passing that field into the `options`,
   * will simply ignore that field.
   * If you *need* to use an `undefined` in the underlying {@link httpResource}, 
   * check out {@link NONE}.
   * 
   * @template TResult 
   * The final output data type of this resource.
   * This type can be inferred via `validate` and `parse.
   * 
   * @template TRaw 
   * The raw response type that is passed to `parse`, may be the same as 
   * `TResult`.
   * This type can be inferred via `parse` and `validateRaw`.
   * 
   * @template TDefault
   * The default type until a real value exists.
   * This type can be inferred by setting `defaultValue`.
   * 
   * @see {@link resource}
   */
  export type ResourceOptions<
    TResult,
    TRaw,
    TDefault extends TResult | undefined,
  > = Request &
    Options<TResult, TRaw> & {
      /** 
       * @see {@link url} to make building them easier.
       */
      url: RequestSignal<string>;

      /**
       * A {@link typia}-created type validator that will be used to verify that the 
       * output type is the expected type.
       * If the `TResult` type is not what the service responds, use the `parse` 
       * option to provide a parser from `TRaw` to `TResult`.
       */
      validate: (input: unknown) => typia.IValidation<TResult>;

      /**
       * The URL method. 
       * 
       * By default is "GET" used.
       */
      method?: "GET" | "POST";


      /**
       * Define the raw response type of the underlying {@link httpResource}.
       * 
       * {@link httpResource} provides 4 ways of calling it:
       * - {@link httpResource} for JSON responses
       * - {@link httpResource.arrayBuffer} for response with an {@link ArrayBuffer}
       * - {@link httpResource.blob} for response with an {@link Blob}
       * - {@link httpResource.text} for response with a string
       * 
       * By setting this option, you can use an alternative raw response type.
       * This is especially useful for byte response or for text formats that 
       * are not JSON. (e.g. a multipart form).
       */
      responseType?: "arrayBuffer" | "blob" | "text";

      /**
       * Validate the input type for `parse`.
       * 
       * Similar to `validate` is this a {@link typia}-created type validator.
       * This together with `validate` ensures that working with `parse` doesn't 
       * fail on weird type errors.
       */
      validateRaw?: (input: unknown) => typia.IValidation<TRaw>;

      /**
        * The default value of this resource.
        * 
        * While a request is inflight, we don't have a value, until then this 
        * default value is used.
        * Setting this value also automatically sets the `TDefault` type of this 
        * resource.
        * By default is `undefined` the default value used.
        * 
        * @privateRemarks
        * The type bound of `TDefault` is `TResult | undefined`.
        * So it has to be of this type.
        * You may need to add your new default type to your `TResult` if it isn't 
        * that already.
       */
      defaultValue?: TDefault;

      /**
       * Define whether authentication should be used.
       * 
       * By default will all requests going to `/api/` be authenticated if the 
       * user is logged in.
       * To specifically authenticate or block doing that, this can be set.
       */
      authenticate?: boolean;

      /**
       * Define how long to cache OK values.
       * 
       * This doesn't cache an error response.
       * The duration is given by a dayjs {@link Duration}.
       * The key for the cache entry will be generated from the URL, the params and 
       * the body as a JSON-encoded string.
       * If a more complex type is used for the params or body, you may need to add 
       * it to the JSON replacer.
       */
      cache?: Duration;

      /**
       * Error handler for specific error codes.
       * 
       * Some errors shouldn't be handled as error but rather as values.
       * To accomplish this you can set a record using {@link HttpStatusCode} as 
       * keys to define what should happen in that instance.
       * 
       * @example
       * A 404 should be handled as an empty array:
       * ```ts
       * {[HttpStatusCode.NotFound]: () => []}
       * ```
       */
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
   * @see {@link ResourceOptions} for info about the options fields.
   * 
   * @returns 
   * A request signal which acts like a regular {@link CoreSignal}.
   * To access the underlying raw resource, use `.resource` on the signal.
   */
  export function resource<
    TResult,
    TRaw = TResult,
    TDefault extends TResult | undefined = undefined,
  >(
    options: ResourceOptions<TResult, TRaw, TDefault>,
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

  /**
   * A template literal tagging function for constructing URLs.
   * 
   * This function may be used to tag string literals to constructs URLs for 
   * {@link resource}.
   * The output of this is a {@link CoreSignal} that represents the formatted 
   * string as long as every value is defined.
   *  
   * @param args
   * The arguments of this template may be raw values like `string`, `number` 
   * or `boolean`.
   * But it also accepts signals that may return any of these values or 
   * `undefined` if they are not ready yet.
   *  
   * @returns 
   * A {@link CoreSignal} with the formatted string or `undefined` if any 
   * provided signal returns `undefined.
   */
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
