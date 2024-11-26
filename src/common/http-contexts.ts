import {HttpContextToken} from "@angular/common/http";
import {Schema} from "ajv";

export const httpContexts = {
  authenticate: new HttpContextToken<boolean>(() => false),
  validateSchema: new HttpContextToken<Schema>(() => false),
};
