import {HttpErrorResponse, HttpInterceptorFn, HttpStatusCode} from "@angular/common/http";
import {inject} from "@angular/core";
import {from, mergeAll} from "rxjs";

import {AuthService} from "./auth.service";
import {httpContexts} from "../../common/http-contexts";

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.context.get(httpContexts.authenticate)) return next(req);

  return from(
    (async () => {
      const authService = inject(AuthService);

      let jwtDecoded = authService.decodedAccessToken();
      if (jwtDecoded?.exp) {
        let currentTime = Math.floor(Date.now() / 1000);
        if (jwtDecoded.exp < currentTime) {
          // token expired, try to refresh
          try {
            await authService.refresh();
          }
          catch (e) {
            if (!(e instanceof HttpErrorResponse)) throw e;
            switch (e.status) {
              // add more if necessary
              case HttpStatusCode.BadRequest:
              case HttpStatusCode.Unauthorized:
                authService.refreshToken.set(null);
                authService.accessToken.set(null);
                await authService.logout();
            }
            throw e;
          }
        }
      }

      let accessToken = authService.accessToken();
      if (accessToken) {
        return next(
          req.clone({
            headers: req.headers.set("Authorization", "Bearer " + accessToken),
          }),
        );
      }

      return next(req);
    })(),
  ).pipe(mergeAll());
};
