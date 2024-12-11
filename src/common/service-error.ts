/**
 * Represents a typical error returned by backend services, following [RFC 9457].
 * 
 * This interface is used to convey standardized error information. 
 * It includes fields for general error details, optional extended information, 
 * and server-specific metadata.
 * 
 * ### Notes:
 * - When interacting with an erroring service, ensure you handle it as 
 *   `Partial<ServiceError>`.
 *   Services may respond with incomplete or unexpected data, so all fields 
 *   should be treated as potentially missing.
 * - The `host` field is automatically populated by the backend during response 
 *   generation.
 * 
 * [RFC 9457]: https://datatracker.ietf.org/doc/html/rfc9457
 */
export interface ServiceError {
  /**
   * A URI reference identifying the problem type.
   * This can serve as a primary identifier and may link to external 
   * documentation.
   */
  type: string;

  /**
   * The HTTP status code associated with the error response.
   * Follows [RFC 9110] standards.
   * 
   * [RFC 9110]: https://www.rfc-editor.org/rfc/rfc9110#section-15
   */
  status: number;

  /**
   * A short, human-readable summary of the problem 
   * (e.g., "Missing Authorization Information").
   */
  title: string;

  /**
   * A human-readable description of the problem with a focus on guidance for 
   * resolution.
   */
  detail: string;

  /**
   * A URI identifying the specific occurrence of the error.
   * This may be dereferenceable for further investigation.
   * 
   * Usually includes a `tag:` URI by the [RFC 4151] standard.
   * 
   * [RFC 4151]: https://datatracker.ietf.org/doc/html/rfc4151
   */
  instance?: string;

  /**
   * Extended error details, often containing a list of related errors 
   * represented as plain strings.
   */
  errors?: string[];

  /**
   * The hostname of the server where the error occurred.
   * Automatically set by the backend during response generation.
   */
  host: string;
}
