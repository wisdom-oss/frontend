import {HttpContextToken} from "@angular/common/http";
import {Schema} from "ajv";
import {Duration} from "dayjs/plugin/duration";
import typia from "typia";

/**
 * Centralized collection of HTTP context tokens used in the frontend.
 *
 * Keeping all HTTP context tokens in one place makes it easier to understand
 * what can affect HTTP requests globally.
 * New HTTP context tokens should also be added here.
 */
export const httpContexts = {
  /**
   * Controls whether a request should be authenticated.
   *
   * By default, requests targeting `/api/` will be automatically authenticated.
   * Explicitly setting this value to `true` or `false` overrides the default
   * behavior.
   */
  authenticate: new HttpContextToken<undefined | boolean>(() => undefined),

  /**
   * Specifies a schema to validate the response data.
   *
   * Uses AJV to validate the response data against a JSON Type Definition (JTD).
   * An error will be thrown if the response does not match the schema.
   *
   * @deprecated
   */
  validateSchema: new HttpContextToken<Schema | undefined>(() => undefined),

  /**
   * Validates response data using a Typia validator.
   *
   * Set this token to a validator function created by `typia.createValidate<T>()`.
   * The function will be called with the response data and must return a Typia
   * validation result.
   *
   * @danger
   * Always call `typia.createValidate<T>()` with a type parameter.
   * If you forget it, the interceptor might hang.
   */
  validateType: new HttpContextToken<
    undefined | ((input: unknown) => typia.IValidation<any>)
  >(() => undefined),

  /**
   * Indicates whether a response should be cached in the IndexedDB.
   *
   * By default, no responses are cached (`undefined` is returned by default).
   *
   * To enable caching, provide a tuple with the following elements:
   *
   * - `string`:
   *  A unique key to identify the cached response.
   *  Ensure keys are globally unique to prevent collisions, as the cache store
   *  is shared across the application.
   *
   * - `Duration`:
   *  The duration for which the response should remain valid.
   */
  cache: new HttpContextToken<undefined | [string, Duration]>(() => undefined),
};
