import {HttpContextToken} from "@angular/common/http";
import {Schema} from "ajv";
import {Duration} from "dayjs/plugin/duration";

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
   */
  validateSchema: new HttpContextToken<Schema | undefined>(() => undefined),

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
