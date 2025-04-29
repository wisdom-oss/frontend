import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
  HttpEventType,
} from "@angular/common/http";
import {Injectable} from "@angular/core";
import {tap, Observable} from "rxjs";

import {SchemaValidationService} from "./schema-validation.service";
import {httpContexts} from "../../common/http-contexts";

@Injectable()
export class SchemaValidationInterceptor implements HttpInterceptor {
  constructor(private service: SchemaValidationService) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    let schema = req.context.get(httpContexts.validateSchema);
    if (!schema) return next.handle(req);

    return next.handle(req).pipe(
      tap(event => {
        if (event.type != HttpEventType.Response) return event;

        let response = event as HttpResponse<unknown>;
        try {
          this.service.validate(schema, response.body);
        } catch (e: unknown) {
          if (e instanceof SchemaValidationService.Error) {
            console.error(
              "expected response type is invalid",
              req,
              response,
              e.errors,
            );
          }

          throw e;
        }

        return event;
      }),
    );
  }
}
