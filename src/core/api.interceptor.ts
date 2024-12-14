import {HttpInterceptorFn} from "@angular/common/http";

import {httpContexts} from "../common/http-contexts";

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.context.get(httpContexts.authenticate) == false) return next(req);

  if (req.url.startsWith("/api/")) {
    req.context.set(httpContexts.authenticate, true);
  }

  return next(req);
};
