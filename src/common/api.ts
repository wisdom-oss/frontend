import {
  httpResource,
  HttpStatusCode,
  HttpContext,
  HttpResourceOptions,
  HttpParams,
  HttpResourceRef,
  HttpResourceRequest,
  HttpErrorResponse,
} from "@angular/common/http";
import {computed, isSignal, signal, Signal as CoreSignal} from "@angular/core";
import dayjs, {Dayjs} from "dayjs";
import {Duration} from "dayjs/plugin/duration";
import {isTypedArray} from "three/src/animation/AnimationUtils.js";
import typia, {tags} from "typia";

import {httpContexts} from "./http-contexts";
import {Once} from "./utils/once";
import {fromEntries} from "./utils/from-entries";
import {keys} from "./utils/keys";

/**
 * Toolkit to build API services.
 *
 * All services in `/src/api/` should make heavy use of this namespace to:
 * - take {@link api.RequestSignal} as input parameters
 * - return {@link api.Signal} values
 * - and internally use {@link api.resource}
 *
 * Utilities like {@link api.url} and {@link api.map} help with handling
 * {@link api.RequestSignal}s more easily.
 *
 * New services should avoid calling Angular's {@link httpResource} directly.
 * Instead, use the functions provided here.
 * They help enforce platform consistency in WISdoM and make things like auth,
 * validation and caching easier.
 */
export namespace api {
  /**
   * Class type of an API service.
   *
   * This is the constructor type of classes that extend {@link ApiService}.
   * We export the type, not the base class, so users cannot subclass it directly.
   *
   * @example
   * export class SomeService extends api.service("/api/something") {}
   */
  export type Service = typeof ApiService;

  /**
   * Represents a typical error returned by backend services, following [RFC 9457].
   *
   * This interface is used to convey standardized error information.
   * It includes fields for general error details, optional extended information,
   * and server-specific metadata.
   *
   * ### Notes:
   * - When interacting with an erroring service, ensure you handle it as
   *   `Partial<api.Error>`.
   *   Services may respond with incomplete or unexpected data, so all fields
   *   should be treated as potentially missing.
   * - The `host` field is automatically populated by the backend during response
   *   generation.
   *
   * [RFC 9457]: https://datatracker.ietf.org/doc/html/rfc9457
   */
  export interface Error {
    /**
     * A URI reference identifying the problem type.
     * This can serve as a primary identifier and may link to external
     * documentation.
     */
    type: string;

    /**
     * The HTTP status code associated with the error response.
     * Follows [RFC 9110] standards.
     *
     * [RFC 9110]: https://www.rfc-editor.org/rfc/rfc9110#section-15
     */
    status: number;

    /**
     * A short, human-readable summary of the problem
     * (e.g., "Missing Authorization Information").
     */
    title: string;

    /**
     * A human-readable description of the problem with a focus on guidance for
     * resolution.
     */
    detail: string;

    /**
     * A URI identifying the specific occurrence of the error.
     * This may be dereferenceable for further investigation.
     *
     * Usually includes a `tag:` URI by the [RFC 4151] standard.
     *
     * [RFC 4151]: https://datatracker.ietf.org/doc/html/rfc4151
     */
    instance?: string;

    /**
     * Extended error details, often containing a list of related errors
     * represented as plain strings.
     */
    errors?: string[];

    /**
     * The hostname of the server where the error occurred.
     * Automatically set by the backend during response generation.
     */
    host: string;
  }

  /**
   * Base class for all API services.
   *
   * Services must provide a `URL` that points to an `/api/...` endpoint.
   * We keep shared expectations here so all services behave the same.
   *
   * Prefer {@link service} to create your own base to extend from,
   * instead of extending this class directly.
   */
  abstract class ApiService {
    get URL(): string {
      return undefined!;
    }
  }

  /**
   * Create an extendable API service class without a constructor.
   *
   * Returns a class that extends {@link ApiService} and fixes its `URL`.
   * Downstream services can `extends` that class and use field injection,
   * so no need to write a constructor or call `super`.
   *
   * @param url An `/api/...` URL literal used as the service root.
   * @returns A {@link Service} class you can extend.
   *
   * @example
   * const URL = "/api/status" as const;
   *
   * @Injectable({ providedIn: "root" })
   * export class StatusService extends api.service(URL) {
   *   // fields via inject(...) here, no constructor
   * }
   */
  export function service<URL extends `/api/${string}`>(url: URL): Service {
    return class extends ApiService {
      override get URL(): string {
        return url;
      }
    };
  }

  /**
   * A request signal can either be a raw value or a signal producing that value.
   *
   * API services should always take these as parameters.
   * This lets consumers pass reactive values that change over time or get
   * resolved later (e.g. user input).
   * It also enables the request to auto-update when the signal changes.
   */
  export type RequestSignal<T> = T | CoreSignal<T | undefined>;

  /**
   * Ensures a {@link RequestSignal} is a signal.
   *
   * If the input is already a signal, we return it.
   * If not, we wrap it in a computed signal.
   */
  export function toSignal<T>(
    input: RequestSignal<T>,
  ): CoreSignal<T | undefined> {
    if (isSignal(input)) return input;
    return computed(() => input);
  }

  /**
   * The signal type returned by API services.
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
    // The `value` is not *really* omitted in the output but avoids accidentally
    // calling `.value()`.
    resource: Omit<HttpResourceRef<T | D>, "value">;
  };

  /**
   * Special marker to explicitly pass `undefined` as a signal value.
   *
   * {@link resource} requires that all input signals return something other than
   * `undefined` to be considered "ready".
   * This makes it hard to send an actual `undefined` value, because `undefined`
   * normally just delays the request.
   *
   * If you really want to send `undefined`, use this symbol instead.
   * It'll pass the readiness check and get turned into `undefined` just before
   * building the actual request.
   */
  export const NONE = Symbol("api.NONE");
  export type NONE = typeof NONE;

  export namespace QueryParams {
    /** Value compatible with query params. */
    export type Value =
      | undefined
      | string
      | number
      | boolean
      | Dayjs
      | Duration;
  }

  /**
   * Container type to hold query parameters.
   *
   * This replaces the {@link HttpParams} class used by Angular regularly and adds behavior for more data types than just primitives.
   * For additional supported types, check {@link QueryParams.Value}.
   *
   * This container type is designed to work hand in hand with the `api` namespace.
   * It provides a static `from` method that converts a {@link RequestSignal} of parameters into a `RequestSignal<QueryParams>`, allowing easy usage when sending query parameters.
   *
   * All methods that modify the container also return the container itself, this allows the usage of the builder pattern but also regular modifying the query params.
   * Different to the {@link HttpParams}, this container is **not** immutable and will change.
   * But in most code the immutability of `HttpParams` were surprising as everything else isn't immutable.
   */
  export class QueryParams {
    private map = new Map();

    /**
     * Construct a query params container from a record holding compatible values.
     * @param params A record with values to be sent.
     */
    constructor(
      params: Record<string, QueryParams.Value | QueryParams.Value[]> = {},
    ) {
      for (let [key, val] of Object.entries(params)) {
        if (!this.map.has(key)) this.map.set(key, []);
        if (Array.isArray(val)) val.forEach(val => this.map.get(key).push(val));
        else this.map.get(key).push(val);
      }
    }

    /**
     * Alternative constructor useful for {@link resource} usage.
     * @param params Raw query parameters or a signal maybe containing them.
     * @returns Query parameters or a signal maybe containing them.
     */
    static from(
      params: RequestSignal<
        Record<string, QueryParams.Value | QueryParams.Value[]>
      >,
    ): RequestSignal<QueryParams> {
      return map(params, params => new QueryParams(params));
    }

    private static serialize(
      value: QueryParams.Value,
    ): undefined | string | boolean | number {
      if (dayjs.isDayjs(value)) return value.toISOString();
      if (dayjs.isDuration(value)) return value.toISOString();
      return value;
    }

    has(param: string): boolean {
      return this.map.get(param)?.length > 0;
    }

    get(param: string): QueryParams.Value | null {
      return this.map.get(param)?.[0] ?? null;
    }

    getAll(param: string): QueryParams.Value[] | null {
      return this.map.get(param) ?? null;
    }

    keys(): string[] {
      return Array.from(this.map.keys());
    }

    append(param: string, value: QueryParams.Value): QueryParams {
      if (!this.map.has(param)) this.map.set(param, [value]);
      else this.map.get(param).push(value);
      return this;
    }

    appendAll(params: {
      [param: string]: QueryParams.Value | QueryParams.Value[];
    }): QueryParams {
      for (let [key, val] of Object.entries(params)) {
        if (!this.map.has(key)) this.map.set(key, []);
        if (Array.isArray(val)) val.forEach(val => this.map.get(key).push(val));
        this.map.get(key).push(val);
      }
      return this;
    }

    set(param: string, value: QueryParams.Value): QueryParams {
      this.map.set(param, [value]);
      return this;
    }

    delete(param: string): QueryParams {
      this.map.delete(param);
      return this;
    }

    toString(): string {
      return this.toHttpParams().toString();
    }

    toHttpParams(): HttpParams {
      return new HttpParams().appendAll(
        Object.fromEntries(
          Object.entries(this.map).map(([key, val]) => [
            key,
            val.map(QueryParams.serialize),
          ]),
        ),
      );
    }

    toJSON(): Record<string, QueryParams.Value> {
      return Object.fromEntries(Object.entries(this.map));
    }
  }

  type Request = {
    [K in keyof Omit<
      HttpResourceRequest,
      | "url"
      | "method"
      | "context"
      | "withCredentials"
      | "transferCache"
      | "cache"
      | "params"
    >]: RequestSignal<HttpResourceRequest[K]>;
  };

  type Options<TResult, TRaw> = Omit<
    HttpResourceOptions<TResult, TRaw>,
    "defaultValue" | "injector"
  >;

  /**
   * Options for {@link resource}.
   *
   * These cover everything needed to configure a resource call.
   * Internally, they're split across:
   * - {@link HttpResourceRequest} (for the request setup)
   * - {@link HttpResourceOptions} (for things like parsing and equality)
   * - and our own extra fields (like `validate`, `authenticate`, or `cache`)
   *
   * Any option that uses a {@link RequestSignal} must return something
   * other than `undefined` to trigger the request.
   * If you really need to pass an actual `undefined` through to the raw
   * {@link httpResource}, use {@link NONE} to do so explicitly.
   *
   * @template TResult
   * The final result type returned by the signal.
   * This is the value you'll get when the request succeeds and passes validation.
   * You can infer this type by setting `validate`, or optionally via `parse`.
   *
   * @template TRaw
   * The unprocessed raw response type from the HTTP request.
   * If you're not using `parse`, this is usually the same as `TResult`.
   * You can infer this type by setting `parse`, or optionally via `validateRaw`.
   *
   * @template TDefault
   * The type returned before the request completes.
   * This is what the signal returns until real data is available.
   * You can infer this type by setting `defaultValue`.
   * If you don't set a value, this will default to `undefined`.
   */
  export type ResourceOptions<
    TResult,
    TRaw,
    TDefault extends TResult | undefined,
  > = (Request &
    Options<TResult, TRaw> & {
      /**
       * URL for the request.
       *
       * This must be provided as a {@link RequestSignal}, meaning it can
       * either be a static string or a signal that dynamically updates over
       * time.
       *
       * You can use {@link url} to construct URLs from tagged templates that
       * include other signals or dynamic parts.
       */
      url: RequestSignal<string>;

      /**
       * Validator for the final result type (`TResult`).
       *
       * This is created using {@link typia} and is used to make sure that the
       * parsed response actually matches what we expect as a final value.
       *
       * If the requested service returns a structure that doesn't directly
       * match `TResult`, use the `parse` option to transform from `TRaw` to
       * `TResult`. This `validate` function will always run on the result
       * of `parse`.
       *
       * Optional, but either this or the pair (`validateRaw` + `parse`)
       * must be provided.
       */
      validate?: (input: unknown) => typia.IValidation<TResult>;

      /**
       * Validator for the raw response type (`TRaw`), before parsing.
       *
       * Just like `validate`, this is also a {@link typia}-generated validator,
       * but it runs on the raw response, before the `parse` function is applied.
       *
       * This is useful when you're working with custom response formats and
       * want to make sure that what you feed into `parse` is safe.
       *
       * Optional, but if you don't provide `validate`, then both this and
       * `parse` must be provided.
       */
      validateRaw?: (input: unknown) => typia.IValidation<TRaw>;

      /**
       * Convert the raw response (`TRaw`) into the final shape (`TResult`).
       *
       * Runs before `validate` on the final result.
       * If the server already gives you a `TResult`, you can skip this.
       *
       * Optional, but if you don't provide `validate`, then both this and
       * `validateRaw` must be provided.
       */
      parse?: (raw: TRaw) => TResult;

      /**
       * HTTP method to use.
       *
       * Defaults to "GET".
       */
      method?: "GET" | "POST" | "PUT";

      /**
       * Controls the raw response type returned by the server.
       *
       * Angular provides different variants of {@link httpResource} based on
       * the expected response type:
       *
       * - {@link httpResource} for JSON responses (default)
       * - {@link httpResource.text} for plain text
       * - {@link httpResource.blob} for binary blobs
       * - {@link httpResource.arrayBuffer} for low-level binary buffers
       *
       * This field selects which one is used.
       * Useful if you're working with non-JSON formats like plain text files,
       * binary uploads, or multipart responses.
       *
       * By using `parse`, you can convert these raw values into a `TResult`.
       */
      responseType?: "arrayBuffer" | "blob" | "text";

      /**
       * The default value returned before a response is available.
       *
       * While a request is still in progress (or hasn't started yet), this
       * value is used instead of `undefined`.
       * If not set, `undefined` will be used.
       *
       * This is especially useful for UI code that expects an initial value.
       * For example, returning an empty array while waiting for a list.
       *
       * Setting this also defines the `TDefault` template parameter.
       *
       * @privateRemarks
       * `TDefault` must be assignable to `TResult | undefined`.
       * So if you're passing in a value not assignable to `TResult`, you'll
       * need to adjust your `TResult` accordingly.
       */
      defaultValue?: TDefault;

      /**
       * Whether to use authentication for this request.
       *
       * By default, any request going to `/api/` will automatically include
       * authentication if the user is logged in.
       *
       * You can override this by explicitly setting this to:
       * - `true` - force-authenticate, even if the URL doesn't start with `/api/`
       * - `false` - explicitly skip authentication
       */
      authenticate?: boolean;

      /**
       * Duration to cache successful (non-error) responses.
       *
       * Caching is only applied to OK results, errors are never cached.
       *
       * The key used for the cache includes:
       * - the resolved URL
       * - the resolved `params`
       * - the resolved `body`
       *
       * The duration must be a {@link Duration} from `dayjs/plugin/duration`.
       *
       * @privateRemarks
       * The values for the key are serialized using {@link JSON.stringify()}.
       * If your request includes more complex values (e.g. {@link HttpParams}
       * or {@link FormData}), we need to apply custom serialization to make
       * sure the cache key stays stable.
       * Add another type to the replace function if necessary.
       */
      cache?: Duration;

      params?: RequestSignal<QueryParams>;

      /**
       * Custom error handler for specific HTTP status codes.
       *
       * Normally, failed requests result in an error, but sometimes, you may
       * want to treat certain errors (like 404) as a valid fallback instead.
       *
       * This field lets you do that.
       * It's a partial record of handlers for specific {@link HttpStatusCode}s.
       *
       * Each handler receives the full {@link HttpErrorResponse} and must
       * return a valid `TResult` to use instead of throwing.
       *
       * @example
       * Treat 404 Not Found as an empty list:
       * ```ts
       * {
       *   [HttpStatusCode.NotFound]: (_err: HttpErrorResponse) => []
       * }
       * ```
       */
      onError?: Partial<
        Record<HttpStatusCode, (err: HttpErrorResponse) => TResult>
      >;
    }) &
    // Enforce that either `validate` is present,
    // or `validateRaw` and `parse` are both present.
    (| {
          validate: (input: unknown) => typia.IValidation<TResult>;
          validateRaw?: (input: unknown) => typia.IValidation<TRaw>;
          parse?: (raw: TRaw) => TResult;
        }
      | {
          validate?: (input: unknown) => typia.IValidation<TResult>;
          validateRaw: (input: unknown) => typia.IValidation<TRaw>;
          parse: (raw: TRaw) => TResult;
        }
    );

  /**
   * Our custom wrapper around Angular's {@link httpResource}.
   *
   * This is the main entry point for building API services in WISdoM.
   * It replaces Angular's raw {@link httpResource} usage with a signal-based
   * interface that handles all our typical needs:
   * - Signals as inputs ({@link RequestSignal}s)
   * - Type-safe validation of responses
   * - Optional parsing, caching, and authentication
   *
   * Unlike Angular's `httpResource`, which takes two arguments
   * (`request` and `options`), this function takes a single `options` object
   * that includes everything.
   * This makes services easier to write and keeps all configuration in one
   * place.
   *
   * Input values like `url`, `params`, or `body` can be plain values or signals.
   * If any signal returns `undefined`, the request will be delayed until all
   * values are ready.
   *
   * @see {@link ResourceOptions} for a full breakdown of the options format.
   *
   * @returns
   * A {@link Signal} containing the result of the request, behaving like a
   * regular {@link CoreSignal}.
   * You can access the actual value by calling it directly.
   * If you need access to the underlying {@link HttpResourceRef}, it's
   * available via `.resource`.
   */
  export function resource<
    TResult,
    TRaw = TResult,
    TDefault extends TResult | undefined = undefined,
  >({
    defaultValue,
    equal,
    ...options
  }: ResourceOptions<TResult, TRaw, TDefault>): Signal<
    TResult,
    NoInfer<TDefault>
  > {
    let httpContext = buildResourceContext(options);
    let resourceRequest = buildResourceRequest(options, httpContext);
    let parse = buildResourceParser(options) as (raw: unknown) => TResult;
    let httpResourceF = selectHttpResourceFunction(options);
    let resourceRef = httpResourceF(resourceRequest, {
      parse,
      defaultValue,
      equal,
    }) as HttpResourceRef<TResult | TDefault>;
    let value = buildResourceErrorHandler(options, resourceRef);
    return Object.assign(value, {resource: resourceRef});
  }

  /**
   * Replaces custom values in the request body or params when generating
   * the cache key.
   *
   * This function is used with `JSON.stringify(...)` to serialize values like
   * {@link HttpParams} or `FormData` in a meaningful way.
   * That ensures the generated cache key stays stable and unique to the input.
   */
  function cacheJSONReplacer(_key: string, value: any): any {
    if (value instanceof HttpParams) return value.toString();
    if (value instanceof FormData) return Array.from(value.entries());
    return value;
  }

  /**
   * Builds the {@link HttpContext} used for the request.
   *
   * This handles both `authenticate` and `cache` options.
   * The context is computed reactively and will update if any
   * of the input signals change.
   *
   * If caching is enabled, we generate a stable cache key from the
   * `url`, `params`, and `body`, even if some of them are signals.
   */
  function buildResourceContext<
    TResult,
    TRaw = TResult,
    TDefault extends TResult | undefined = undefined,
  >({
    authenticate,
    cache,
    url,
    params,
    body,
  }: ResourceOptions<TResult, TRaw, TDefault>): CoreSignal<HttpContext> {
    return computed(() => {
      let context = new HttpContext().set(
        httpContexts.authenticate,
        authenticate,
      );

      if (cache !== undefined) {
        let cacheKey = JSON.stringify(
          {
            url: isSignal(url) ? url() : url,
            params: isSignal(params) ? params() : params,
            body: isSignal(body) ? body() : body,
          },
          cacheJSONReplacer,
        );

        context = context.set(httpContexts.cache, [cacheKey, cache]);
      }

      return context;
    });
  }

  /**
   * Builds the request signal used by {@link httpResource}.
   *
   * This signal returns `undefined` until all inputs (like `url`, `body`, etc.)
   * are ready. That means:
   * - if a signal is passed and it's still `undefined`, the request is delayed.
   * - if a direct value is passed, even `undefined`, we use it as-is.
   *
   * This gives fine-grained control over when a request should start
   * and lets the caller delay based on reactive inputs.
   *
   * Signals are unwrapped, and special values like {@link NONE}
   * are treated as explicit `undefined`s after the readiness check.
   */
  function buildResourceRequest<
    TResult,
    TRaw = TResult,
    TDefault extends TResult | undefined = undefined,
  >(
    options: ResourceOptions<TResult, TRaw, TDefault>,
    httpContext: CoreSignal<HttpContext>,
  ): CoreSignal<HttpResourceRequest | undefined> {
    return computed(() => {
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
  }

  /**
   * Builds the `parse` function passed to {@link httpResource}.
   *
   * This function applies type validation using the provided `validate` function.
   * If `parse` is defined, it is used to transform the raw server response first.
   *
   * If `validateRaw` is set, the raw response is also validated before parsing.
   * This ensures that both raw and parsed types are safe and match what we expect.
   *
   * If any validation fails, an error is thrown and logged to the console.
   */
  function buildResourceParser<
    TResult,
    TRaw = TResult,
    TDefault extends TResult | undefined = undefined,
  >({
    validateRaw,
    parse,
    validate,
  }: ResourceOptions<TResult, TRaw, TDefault>): (raw: TRaw) => TResult {
    return raw => {
      let result = raw as unknown as TResult;
      if (parse) {
        if (validateRaw) {
          let validRaw = validateRaw(raw);
          if (!validRaw.success) {
            console.error(validRaw.errors);
            throw new Error("Invalid type on raw response");
          }
        }

        result = parse(raw);
      }

      if (validate) {
        let validResult = validate(result);
        if (!validResult.success) {
          console.error(validResult.errors);
          throw new Error("Invalid type on response");
        }
      }

      return result;
    };
  }

  /**
   * Selects the appropriate variant of {@link httpResource} based on `responseType`.
   *
   * Angular provides multiple built-in versions of `httpResource` for different
   * types of responses:
   * - JSON (default)
   * - text
   * - blob
   * - arrayBuffer
   *
   * This function chooses the correct one depending on what the user has set.
   */
  function selectHttpResourceFunction<
    TResult,
    TRaw = TResult,
    TDefault extends TResult | undefined = undefined,
  >({
    responseType,
  }: ResourceOptions<TResult, TRaw, TDefault>): (
    request: () => HttpResourceRequest | undefined,
    options: HttpResourceOptions<TResult, unknown>,
  ) => HttpResourceRef<TResult | undefined> {
    // prettier-ignore
    switch (responseType) {
      case undefined: return httpResource<TResult>;
      case "text": return httpResource.text;
      case "arrayBuffer": return httpResource.arrayBuffer;
      case "blob": return httpResource.blob;
    }
  }

  /**
   * Handles request errors by checking for a matching handler in `onError`.
   *
   * If the underlying {@link HttpResourceRef} reports an error and a handler
   * is defined for the matching {@link HttpStatusCode}, the handler is called
   * and its return value is used as the result.
   *
   * Otherwise, the signal just returns `.value()` from the resource.
   *
   * This is useful for treating some errors (like 404) as values, not failures.
   */
  function buildResourceErrorHandler<
    TResult,
    TRaw = TResult,
    TDefault extends TResult | undefined = undefined,
  >(
    {onError, defaultValue}: ResourceOptions<TResult, TRaw, TDefault>,
    resourceRef: HttpResourceRef<TResult | TDefault>,
  ): CoreSignal<TResult | TDefault> {
    return computed(() => {
      let error = resourceRef.error();
      if (error && error instanceof HttpErrorResponse) {
        let handler = onError?.[error.status as HttpStatusCode];
        if (handler) return handler(error);
        return defaultValue as TDefault;
      }

      return resourceRef.value();
    });
  }

  /**
   * A signal-based WebSocket connection.
   *
   * Returned by {@link socket}, this type allows reactive handling of WebSocket
   * messages.
   *
   * It extends Angular's {@link CoreSignal}, letting you directly get the current
   * message value by calling the signal.
   *
   * The additional methods `.send()` and `.close()` control the WebSocket
   * connection directly.
   *
   * @template TMessage
   * Type of messages received from the server.
   *
   * @template TSend
   * Type of messages that can be sent to the server via `.send()`.
   *
   * @template TDefault
   * Default value initially returned before any message is received.
   */
  export type Socket<TMessage, TSend, TDefault = undefined> = CoreSignal<
    TMessage | TDefault
  > & {
    /** Close the WebSocket connection. */
    close(): void;
    /**
     * Send a message through the WebSocket.
     *
     * This automatically waits until the socket is open.
     */
    send(message: TSend): void;
  };

  /**
   * Configuration options for creating a WebSocket connection using
   * {@link socket}.
   *
   * Includes settings like URL, protocols, validation, event handlers,
   * and a default message value.
   *
   * @template TMessage
   * Type of messages received from the server, validated via `validate`.
   *
   * @template TSend
   * Type of messages that can be sent to the server.
   *
   * @template TDefault
   * Default value initially returned before any message is received.
   *
   * @template TRaw
   * Raw message format from the WebSocket.
   *
   * @template TSerialized
   * JSON-able format to send to the WebSocket.
   */
  export type SocketOptions<
    TMessage,
    TSend,
    TDefault = undefined,
    TRaw = TMessage,
    TSerialized = TSend,
  > = {
    /** URL of the WebSocket server. */
    url: ConstructorParameters<typeof WebSocket>[0];

    /**
     * Typia validator to ensure incoming (parsed) messages match the expected
     * type.
     */
    validate: (input: unknown) => typia.IValidation<TMessage>;

    /**
     * Typia validator to ensure incoming raw messages match the expected type.
     */
    validateRaw?: (input: unknown) => typia.IValidation<TRaw>;

    /**
     * Parse the raw messages into a message format to be used in the public API.
     * @param input Raw incoming message, validated via {@link validateRaw}.
     */
    parse?: (input: TRaw) => TMessage;

    /**
     * Serialize the message to send it to the socket.
     *
     * This should take care of mapping complex types into easily JSON-able types.
     */
    serialize?: (input: TSend) => TSerialized;

    /** Protocols to use when connecting to the WebSocket server. */
    protocols?: ConstructorParameters<typeof WebSocket>[1];

    /**
     * Binary data type expected from the WebSocket server
     * (e.g., "blob", "arraybuffer").
     */
    binaryType?: WebSocket["binaryType"];

    /** Called when the WebSocket connection closes. */
    onClose?: (
      socket: Socket<TMessage, TSend, TDefault>,
      event: CloseEvent,
    ) => void;

    /** Called when the WebSocket connection encounters an error. */
    onError?: (socket: Socket<TMessage, TSend, TDefault>, event: Event) => void;

    /** Called when the WebSocket connection successfully opens. */
    onOpen?: (socket: Socket<TMessage, TSend, TDefault>, event: Event) => void;

    /**
     * Called when a message is received from the WebSocket server.
     *
     * This is the raw received message without any validation.
     * Also the main purpose to use the {@link socket} function is to access
     * messages via the signal interface.
     */
    onMessage?: (
      socket: Socket<TMessage, TSend, TDefault>,
      event: MessageEvent,
    ) => void;

    /** Default message value initially returned by the socket signal. */
    defaultValue?: TDefault;
  };

  /**
   * Opens a WebSocket connection and returns a reactive {@link Socket}.
   *
   * The socket reacts to incoming messages by validating and updating the signal.
   * It also provides methods for sending messages and closing the connection.
   *
   * @returns
   * A {@link Socket} object that lets you:
   * - Reactively read incoming messages by calling the signal.
   * - Send messages with `.send()`.
   * - Close the connection with `.close()`.
   *
   * @see {@link SocketOptions} for configuration details.
   */
  export function socket<
    TMessage,
    TSend,
    TDefault = undefined,
    TRaw = TMessage,
    TSerialized = TSend,
  >({
    url,
    validate,
    validateRaw,
    parse,
    serialize,
    protocols,
    binaryType,
    onClose,
    onError,
    onOpen,
    onMessage,
    defaultValue,
  }: SocketOptions<TMessage, TSend, TDefault, TRaw, TSerialized>): Socket<
    TMessage,
    TSend,
    TDefault
  > {
    let webSocket = new WebSocket(url, protocols);
    if (binaryType) webSocket.binaryType = binaryType;

    let waitUntilOpen = new Once();
    let send = (message: TSend) => {
      let payload = serialize ? serialize(message) : message;

      waitUntilOpen.then(() => {
        if (
          payload instanceof ArrayBuffer ||
          payload instanceof Blob ||
          isTypedArray(payload) ||
          payload instanceof DataView
        )
          webSocket.send(payload as ArrayBuffer | Blob | ArrayBufferLike);
        else if (typeof payload === "string") webSocket.send(payload);
        else webSocket.send(JSON.stringify(payload));
      });
    };

    let writeSignal = signal<TMessage | TDefault>(defaultValue as TDefault);
    let socket = Object.assign(writeSignal, {
      close: webSocket.close,
      send,
    });

    let addEventListener = webSocket.addEventListener;
    if (onClose) addEventListener("close", ev => onClose(socket, ev));
    if (onError) addEventListener("error", ev => onError(socket, ev));
    if (onOpen) addEventListener("open", ev => onOpen(socket, ev));
    if (onMessage) addEventListener("message", ev => onMessage(socket, ev));

    webSocket.addEventListener("open", () => waitUntilOpen.set());
    webSocket.addEventListener("message", ev => {
      let message;
      if (typeof ev.data === "string") message = JSON.parse(ev.data);
      else if (webSocket.binaryType === "blob") message = new Blob(ev.data);
      else if (webSocket.binaryType === "arraybuffer")
        message = new ArrayBuffer(ev.data);

      if (validateRaw) {
        let checked = validateRaw(message);
        if (!checked.success) {
          console.error(checked.errors);
          throw new Error("Invalid type on raw message");
        }
      }

      if (parse) message = parse(message);

      let checked = validate(message);
      if (!checked.success) {
        console.error(checked.errors);
        throw new Error("Invalid type on message");
      }

      writeSignal.set(checked.data);
    });

    return socket;
  }

  /**
   * Template literal tagging function for building URLs.
   *
   * This is a helper for creating dynamic URLs to use with {@link resource}.
   * It works like a regular tagged template string but supports signals.
   *
   * The returned {@link CoreSignal} updates automatically as soon as any of the
   * dynamic parts change and will return `undefined` until all values are ready.
   *
   * @param template
   * The static parts of the template string.
   * These remain unchanged.
   *
   * @param args
   * Dynamic values inserted into the template.
   * Each value may be:
   * - a static string, number, or boolean
   * - a {@link RequestSignal} of one of those types
   *
   * If any signal returns `undefined`, the whole URL will return `undefined`
   * until all values are available.
   *
   * @returns
   * A {@link CoreSignal} that gives the final string once all arguments are
   * defined.
   * Until then, it will return `undefined`.
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
   * Map a {@link RequestSignal} to a new value.
   *
   * This is a utility to work with {@link RequestSignal}s regardless of whether
   * you're dealing with a raw value or a signal.
   * It lets you transform the inner value in a consistent way.
   *
   * If the input is a raw value, `f` is called directly with it.
   * If the input is a signal, the returned signal will call `f` whenever the
   * inner value changes, unless that value is `undefined`, in which case the
   * mapping is skipped and the output becomes `undefined`.
   *
   * @param request
   * A {@link RequestSignal}, either a raw value or a signal producing `T`.
   *
   * @param f
   * A mapping function that takes the raw `T` and returns a transformed `U`.
   * Will never be called with `undefined`.
   *
   * @returns
   * A new {@link RequestSignal} producing the mapped value.
   * Will return `undefined` if the original signal is undefined.
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

  /** @deprecated */
  export type DeserializedRecord<T> = {
    [K in keyof T]: T[K] extends string & tags.Format<"date-time">
      ? Dayjs
      : T[K] extends string & tags.Format<"duration">
        ? Duration
        : T[K];
  };

  export type RawRecord<T> = {
    [K in keyof T]: T[K] extends Dayjs
      ? string & tags.Format<"date-time">
      : T[K] extends Duration
        ? string & tags.Format<"duration">
        : T[K];
  };
}
