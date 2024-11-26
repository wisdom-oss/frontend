import {HttpContextToken} from "@angular/common/http";
import {Schema} from "ajv";

export const httpContexts = {
  authenticate: new HttpContextToken<undefined | boolean>(() => undefined),
  validateSchema: new HttpContextToken<Schema>(() => false),
};
