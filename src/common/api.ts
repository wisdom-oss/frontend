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
  export type Signal<T, D = undefined> = CoreSignal<T | D> & {
    resource: HttpResourceRef<T | D>;
  };

  export type MaybeSignal<T> = T | CoreSignal<T>;

  type Request = {
    [K in keyof Omit<
      HttpResourceRequest,
      "context" | "withCredentials" | "transferCache"
    >]: MaybeSignal<HttpResourceRequest[K]>;
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
        defaultValue?: TDefault;
        authenticate?: boolean;
        cache?: Duration;
        onError?: Partial<
          Record<HttpStatusCode, (err: HttpErrorResponse) => TDefault>
        >;
      },
  ): Signal<TResult, TDefault> {
    let {
      url,
      method,
      body,
      params,
      headers,
      reportProgress,
      equal,
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
      let cacheKey = JSON.stringify({url, params, body});
      context = context.set(httpContexts.cache, [cacheKey, cache]);
    }

    let resourceRequest = computed(
      (): HttpResourceRequest => ({
        url: isSignal(url) ? url() : url,
        method: isSignal(method) ? method() : method,
        body: isSignal(body) ? body() : body,
        params: isSignal(params) ? params() : params,
        headers: isSignal(headers) ? headers() : headers,
        reportProgress: isSignal(reportProgress)
          ? reportProgress()
          : reportProgress,
      }),
    );

    let parse = (raw: TRaw): TResult => {
      let result = raw as unknown as TResult;
      if (options.parse) {
        let validRaw = typia.validate<TRaw>(raw);
        if (!validRaw.success) {
          console.error(validRaw.errors);
          throw new Error("Invalid type on raw response");
        }

        result = options.parse(raw);
      }

      console.log("before validate");
      let validResult = typia.validate<TResult>(result);
      console.log("after validate");
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
}
