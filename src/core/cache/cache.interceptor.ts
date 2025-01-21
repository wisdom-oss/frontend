import {
  HttpInterceptorFn,
  HttpResponse,
  HttpEventType,
} from "@angular/common/http";
import {inject} from "@angular/core";
import {from, mergeAll, of, tap} from "rxjs";

import {CacheService} from "./cache.service";
import {httpContexts} from "../../common/http-contexts";

export const cacheInterceptor: HttpInterceptorFn = (req, next) => {
  let useCache = req.context.get(httpContexts.cache);
  if (!useCache) return next(req);

  return from(
    (async () => {
      let service = inject(CacheService);

      let [key, ttl] = useCache;
      let cacheEntry = await service.get(key);
      if (cacheEntry !== null) return of(new HttpResponse({body: cacheEntry}));

      return next(req).pipe(
        tap(async event => {
          if (event.type != HttpEventType.Response) return event;

          let response = event as HttpResponse<unknown>;
          await service.set(key, response.body, ttl);

          return event;
        }),
      );
    })(),
  ).pipe(mergeAll());
};
