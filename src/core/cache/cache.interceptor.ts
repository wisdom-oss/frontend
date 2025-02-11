import {
  HttpInterceptorFn,
  HttpResponse,
  HttpEventType,
} from "@angular/common/http";
import {inject} from "@angular/core";
import {defer, from, of, switchMap, tap} from "rxjs";

import {CacheService} from "./cache.service";
import {httpContexts} from "../../common/http-contexts";

export const cacheInterceptor: HttpInterceptorFn = (req, next) => {
  let useCache = req.context.get(httpContexts.cache);
  if (!useCache) return next(req);

  let nextAndUpdate = defer(() =>
    next(req).pipe(
      tap(async event => {
        if (event.type != HttpEventType.Response) return event;
        let response = event as HttpResponse<unknown>;
        await service.set(key, response.body, ttl);
        return event;
      }),
    ),
  );

  let service = inject(CacheService);
  let [key, ttl] = useCache;
  return from(service.get(key)).pipe(
    switchMap(value => {
      if (value !== null) return of(new HttpResponse({body: value}));
      return nextAndUpdate;
    }),
  );
};
