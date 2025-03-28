import {
  HttpContext,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
  HttpErrorResponse,
  HttpResponse,
} from "@angular/common/http";
import {TestBed} from "@angular/core/testing";
import dayjs from "dayjs";
import {firstValueFrom, of, throwError} from "rxjs";

import {cacheInterceptor} from "./cache.interceptor";
import {CacheService} from "./cache.service";
import {httpContexts} from "../../common/http-contexts";

// Angular's HTTP testing utilities don’t work properly for this case right now,
// so we just check the interceptor’s behavior externally.
// If this gets fixed, we can follow the official guide:
// https://angular.dev/guide/http/testing
// Related issue: https://github.com/angular/angular/issues/25965

const wait = async (time: number) =>
  await new Promise(res => setTimeout(res, time));

describe("cacheInterceptor", () => {
  const url = "https://example.com";
  const duration = dayjs.duration(200, "ms");
  const context = new HttpContext().set(httpContexts.cache, [url, duration]);
  const req = new HttpRequest("GET", url, {context});
  const body = "somebody that I used to know";

  let httpHandler: HttpHandlerFn;
  beforeEach(async () => {
    TestBed.configureTestingModule({providers: [CacheService]});
    TestBed.inject(CacheService).clear();
    httpHandler = jest.fn(_ =>
      of(new HttpResponse<string>({status: 200, body})),
    );
  });

  const cacheInterceptorInContext: HttpInterceptorFn = (req, next) => {
    return TestBed.runInInjectionContext(() => {
      return cacheInterceptor(req, next);
    });
  };

  it("should intercept the response once the cache has a value", async () => {
    let firstRes = (await firstValueFrom(
      cacheInterceptorInContext(req, httpHandler),
    )) as HttpResponse<string>;
    expect(firstRes.body).toEqual(body);
    expect(httpHandler).toHaveBeenCalledTimes(1);

    let secondRes = (await firstValueFrom(
      cacheInterceptorInContext(req, httpHandler),
    )) as HttpResponse<string>;
    expect(secondRes.body).toEqual(body);
    expect(httpHandler).toHaveBeenCalledTimes(1);
  });

  it("should request again if the cache is old", async () => {
    let firstRes = (await firstValueFrom(
      cacheInterceptorInContext(req, httpHandler),
    )) as HttpResponse<string>;
    expect(firstRes.body).toEqual(body);
    expect(httpHandler).toHaveBeenCalledTimes(1);

    let secondRes = (await firstValueFrom(
      cacheInterceptorInContext(req, httpHandler),
    )) as HttpResponse<string>;
    expect(secondRes.body).toEqual(body);
    expect(httpHandler).toHaveBeenCalledTimes(1);

    await wait(250);

    let thirdRes = (await firstValueFrom(
      cacheInterceptorInContext(req, httpHandler),
    )) as HttpResponse<string>;
    expect(thirdRes.body).toEqual(body);
    expect(httpHandler).toHaveBeenCalledTimes(2);
  });

  it("should not cache unsuccessful responses", async () => {
    // Simulate an unsuccessful response (e.g., status 400).
    let httpErrorHandler = jest.fn(() =>
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            statusText: "Bad Request",
            error: "error",
          }),
      ),
    );

    try {
      await firstValueFrom(cacheInterceptorInContext(req, httpErrorHandler));
      fail("Expected an error, but got a response");
    } catch (e) {
      let error = e as HttpErrorResponse;
      expect(error).toBeInstanceOf(HttpErrorResponse);
      expect(error.status).toEqual(400);
      expect(error.error).toEqual("error");
    }

    expect(httpErrorHandler).toHaveBeenCalledTimes(1);

    // The second call should not hit the cache and call the handler again.
    try {
      await firstValueFrom(cacheInterceptorInContext(req, httpErrorHandler));
      fail("Expected an error, but got a response");
    } catch (e) {
      let error = e as HttpErrorResponse;
      expect(error).toBeInstanceOf(HttpErrorResponse);
      expect(error.status).toEqual(400);
      expect(error.error).toEqual("error");
    }

    expect(httpErrorHandler).toHaveBeenCalledTimes(2);
  });
});
