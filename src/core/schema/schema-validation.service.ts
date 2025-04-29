import {Injectable} from "@angular/core";
import {DefinedError, Schema} from "ajv";
import Ajv from "ajv/dist/jtd";

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

@Injectable({
  providedIn: "root",
})
export class SchemaValidationService {
  static readonly Error = SchemaValidationError;

  private ajv = new Ajv();

  /**
   * Validates the given data against the specified schema.
   *
   * @throws {SchemaValidationError} If validation fails.
   */
  validate<T>(schema: Schema, toValidate: T): T {
    let validate = this.ajv.compile(schema);
    if (!validate(toValidate)) {
      throw new SchemaValidationService.Error(
        toValidate,
        // this casting is given in the example for ajv
        // see: https://ajv.js.org/guide/typescript.html#type-safe-error-handling
        validate.errors as DefinedError[],
      );
    }

    return toValidate;
  }
}
