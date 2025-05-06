import {HttpInterceptorFn, HttpResponse} from "@angular/common/http";
import {tap} from "rxjs";

import {httpContexts} from "../common/http-contexts";

export const validateTypeInterceptor: HttpInterceptorFn = (req, next) => {
  let validator = req.context.get(httpContexts.validateType);
  if (!validator) return next(req);

  return next(req).pipe(
    tap(event => {
      if (event instanceof HttpResponse) {
        let valid = validator(event.body);
        if (valid.success == false) {
          let msg = "expected response type is invalid";
          console.error(valid);
          throw new Error(msg);
        }
      }
    }),
  );
};
