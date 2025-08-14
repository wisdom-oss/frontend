// oxlint-disable unicorn/no-thenable

/**
 * A one-time value container that acts like a promise.
 *
 * `Once` can be set exactly once.
 * Consumers can `await` or `.then` it.
 */
export class Once<T = void> implements PromiseLike<T> {
  private promise: Promise<T>;
  private resolve!: (value: T) => void;
  private isSet = false;

  readonly then: PromiseLike<T>["then"];

  constructor() {
    this.promise = new Promise<T>(resolve => (this.resolve = resolve));
    this.then = (...args) => this.promise.then(...args);
  }

  /**
   * Sets the value if it hasn't been set yet.
   *
   * @param value The value to resolve the promise with.
   * @throws If the value has already been set.
   */
  set(value: T): void {
    if (this.isSet) {
      throw new Error("already set");
    }

    this.isSet = true;
    this.resolve(value);
  }
}
