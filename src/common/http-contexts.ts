import {HttpContextToken} from "@angular/common/http";
import {Schema} from "ajv";

export const httpContexts = {
  validateSchema: new HttpContextToken<Schema>(() => false),
};
