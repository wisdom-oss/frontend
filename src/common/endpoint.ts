/* oxlint-disable */

import {HttpClient, HttpHeaders} from "@angular/common/http";
import {
  inject,
  isSignal,
  ValueEqualityFn,
  Injector,
  Signal,
} from "@angular/core";
import {Duration} from "dayjs/plugin/duration";
import {firstValueFrom} from "rxjs";
import typia from "typia";

import {api} from "./api";

export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS"
  | "TRACE"
  | "CONNECT";

export type RequestSignal<T> = T | Signal<T | undefined>;

type UnwrapRequestSignal<T> = T extends RequestSignal<infer U> ? U : T;
type UnwrapArgs<Args extends readonly unknown[]> = {
  [K in keyof Args]: UnwrapRequestSignal<Args[K]>;
};

export const NONE = Symbol("api.NONE");
export type NONE = typeof NONE;

type EndpointStaticResourceOptions<TResult> = Partial<{
  defaultValue: NoInfer<TResult>;
  equal: ValueEqualityFn<NoInfer<TResult>>;
  debugName: string;
}>;

export function endpoint(): EndpointBuilder<
  unknown[],
  unknown,
  unknown,
  "needs url",
  "needs validation"
> {
  return new EndpointBuilder({});
}

// prettier-ignore
class EndpointBuilder<
  Args extends unknown[],
  Result,
  Raw,
  UrlState extends "needs url" | "has url",
  ValidateState extends "needs validation" | "parses raw" | "validates raw" | "has validation",
> {
  private urlState?: UrlState;
  private validateState?: ValidateState;

  constructor(private options: {
    // necessary options
    url?: (...args: Args) => RequestSignal<string>;
    validate?: (result: unknown) => typia.IValidation<Result>;
    validateRaw?: (raw: unknown) => typia.IValidation<Raw>;
    parse?: (raw: Raw) => Result;

    // static options
    injector?: Injector;
    method?: HttpMethod;
    cache?: Duration;

    // optional data to send
    body?: (...args: Args) => unknown;
    params?: (...args: Args) => RequestSignal<api.QueryParams>;
    headers?: (...args: Args) => RequestSignal<HttpHeaders>;
  }) {}

  url<Args extends unknown[]>(
    this: EndpointBuilder<unknown[], Result, Raw, "needs url", ValidateState>, 
    url: RequestSignal<string> | ((...args: Args) => RequestSignal<string>)
  ): EndpointBuilder<Args, Result, Raw, "has url", ValidateState> {
    this.assertNotASignal(url);
    let options = this.options as any;
    if (typeof url == "function" && !isSignal(url)) options.url = url;
    else options.url = () => url;
    return new EndpointBuilder(options);
  }

  validate<Result>(
    this: EndpointBuilder<Args, unknown, unknown, UrlState, "needs validation">, 
    validator: (result: unknown) => typia.IValidation<Result>
  ): EndpointBuilder<Args, Result, Result, UrlState, "has validation"> {
    return new EndpointBuilder({
      ...this.options as any,
      validate: validator
    });
  }

  validateRaw<Raw>(this: EndpointBuilder<Args, unknown, unknown, UrlState, "needs validation">, validator: (raw: unknown) => typia.IValidation<Raw>): EndpointBuilder<Args, unknown, Raw, UrlState, "validates raw">;
  validateRaw(this: EndpointBuilder<Args, Result, Raw, UrlState, "parses raw">, validator: (raw: unknown) => typia.IValidation<Raw>): EndpointBuilder<Args, Result, Raw, UrlState, "has validation">;
  validateRaw(
    validator: (raw: unknown) => typia.IValidation<Raw>
  ): EndpointBuilder<Args, any, Raw, UrlState, any> {
    return new EndpointBuilder({
      ...this.options as any,
      validateRaw: validator
    });
  }

  parse<Raw, Result>(this: EndpointBuilder<Args, unknown, unknown, UrlState, "needs validation">, parser: (raw: Raw) => Result): EndpointBuilder<Args, Result, Raw, UrlState, "parses raw">;
  parse<Raw, Result>(this: EndpointBuilder<Args, unknown, Raw, UrlState, "validates raw">, parser: (raw: Raw) => Result): EndpointBuilder<Args, Result, Raw, UrlState, "has validation">;
  parse<Raw, Result>(
    parser: (raw: Raw) => Result
  ): EndpointBuilder<Args, Result, Raw, UrlState, any> {
    return new EndpointBuilder({
      ...this.options as any,
      parse: parser,
    });
  }

  injector(injector: Injector): this {
    this.options.injector = injector;
    return this;
  }

  method(method: HttpMethod): this {
    this.options.method = method;
    return this;
  }

  cache(duration: Duration): this {
    this.options.cache = duration;
    return this;
  }

  body(body: (...args: Args) => unknown): this {
    this.assertNotASignal(body);
    this.options.body = body;
    return this;
  }

  params(params: api.QueryParams | ((...args: Args) => RequestSignal<api.QueryParams>)): this {
    this.assertNotASignal(params);
    if (typeof params == "function") this.options.params = params;
    else this.options.params = () => params;
    return this;
  }

  headers(headers: HttpHeaders | ((...args: Args) => RequestSignal<HttpHeaders>)): this {
    this.assertNotASignal(headers);
    if (typeof headers == "function") this.options.headers = headers;
    else this.options.headers = () => headers;
    return this;
  }

  build(
    this: EndpointBuilder<Args, Result, Raw, "has url", "has validation">
  ): Endpoint<Args, Result, Raw> {
    return Object.assign(this.buildResource(), {send: this.buildSender()})
  }

  private buildResource(): (...args: Args) => Signal<Result> {
    throw new Error("not yet implemented");
  }

  private buildSender(): (...args: UnwrapArgs<Args>) => Promise<Result> {
    let http = this.options.injector?.get(HttpClient) ?? inject(HttpClient);
    return async (...args: UnwrapArgs<Args>) => {
      let makeUrl = this.options.url!(...args as Args);
      let url = isSignal(makeUrl) ? makeUrl() : makeUrl;
      url = typia.assert<string>(url);

      let body = this.options.body?.(...args as Args);

      let makeQueryParams = this.options.params?.(...args as Args);
      let queryParams = makeQueryParams && 
        isSignal(makeQueryParams) ? makeQueryParams() : makeQueryParams;
      let params = queryParams?.toHttpParams();

      let makeHeaders = this.options.headers?.(...args as Args);
      let headers = makeHeaders && 
        isSignal(makeHeaders) ? makeHeaders() : makeHeaders;

      let method = this.options.method ?? "GET";

      let res = http.request<unknown>(method, url, {body, params, headers});
      let first = await firstValueFrom(res);

      if (this.options.validateRaw && this.options.parse) {
        let validation = this.options.validateRaw(first);
        // TODO: do better error handling here
        if (!validation.success) throw new Error("raw validation failed");
        return this.options.parse(validation.data);
      }

      if (this.options.validate) {
        let validation = this.options.validate(first);
        // TODO: also here better handling
        if (!validation.success) throw new Error("validation failed");
        return validation.data;
      }

      throw new Error("invalid state");
    }
  }

  assertNotASignal(value: unknown) {
    if (isSignal(value)) throw new Error(
      [
        "Invalid usage: signal passed directly.",
        "",
        "Pass a function that returns a signal.",
        "Functions are executed in a reactive context for resources."
      ].join("\n")
    );
  }
}

type Endpoint<Args extends unknown[], Result, Raw> = ((
  ...args: Args
) => Signal<Result>) & {send: (...args: UnwrapArgs<Args>) => Promise<Result>};

let instance = endpoint()
  .url((string: string) => "abc")
  .validateRaw(typia.createValidate<string>())
  .parse(abc => abc)
  .build();
