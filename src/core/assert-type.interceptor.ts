import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { tap } from 'rxjs';
import { httpContexts } from '../common/http-contexts';
import { TypeGuardError } from 'typia';

export const assertTypeInterceptor: HttpInterceptorFn = (req, next) => {
  let guard = req.context.get(httpContexts.assertType);
  if (!guard) return next(req);
  
  return next(req).pipe(tap((event => {
    if (event instanceof HttpResponse) {
      try {
        let _: any = guard(event.body);
      } catch (e: unknown) {
        if (e instanceof TypeGuardError) {
          console.error(
            "expected response type is invalid",
            req,
            event.body,
            e,
          );
        }

        throw e;
      }
    }
  })));
};
