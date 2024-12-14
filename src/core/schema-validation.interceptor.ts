import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
  HttpEventType,
} from "@angular/common/http";
import {Injectable} from "@angular/core";
import {DefinedError} from "ajv";
import Ajv from "ajv/dist/jtd";
import {tap, Observable} from "rxjs";

import {httpContexts} from "../common/http-contexts";

@Injectable()
export class SchemaValidationInterceptor implements HttpInterceptor {
  readonly Error = SchemaValidationError;

  private ajv = new Ajv();

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
        let validate = this.ajv.compile(schema);
        if (!validate(response.body)) {
          // this casting is given in the example for ajv
          // see: https://ajv.js.org/guide/typescript.html#type-safe-error-handling
          console.error(validate.errors);
          throw new this.Error(
            response.body,
            validate.errors as DefinedError[],
          );
        }

        return event;
      }),
    );
  }
}

class SchemaValidationError extends Error {
  constructor(
    readonly invalid: any,
    readonly errors: DefinedError[],
  ) {
    let message = "Expected response type is invalid.";
    super(message);
    this.name = SchemaValidationError.name;
  }
}
