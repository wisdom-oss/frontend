import {
  HttpStatusCode,
  HttpInterceptorFn,
  HttpErrorResponse,
} from "@angular/common/http";
import {inject} from "@angular/core";
import {TagUri} from "@cptpiepmatz/tag-uri";
import {catchError, throwError} from "rxjs";

import {AuthService} from "./auth/auth.service";
import {ServiceError} from "../common/service-error";

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  let authService = inject(AuthService);

  return next(req).pipe(
    catchError(err => {
      if (err instanceof HttpErrorResponse) {
        if (err.status == HttpStatusCode.Unauthorized) authService.logout();

        let errorTag = err.error as Partial<ServiceError>;
        if (errorTag.instance) {
          let tag = TagUri.parse(errorTag.instance);
          if (tag.specific.split(":").includes("JsonWebTokenMalformed")) {
            authService.logout();
          }
        }
      }

      return throwError(() => err); // re-emit the error
    }),
  );
};
