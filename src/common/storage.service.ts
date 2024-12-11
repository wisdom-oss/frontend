import {Injectable} from "@angular/core";

const PREFIX = "wisdom-oss/frontend";
type AnyConstructor = new (...args: any[]) => any;

/**
 * Provides storage management for session and local storage with class-based 
 * key scoping.
 * Ensures no duplicate class registration for storage instances.
 */
@Injectable({
  providedIn: "root",
})
export class StorageService {
  /** Re-export of DuplicateClassError for namespacing. */
  DuplicateClassError = DuplicateClassError;

  private knownClasses = new Set<AnyConstructor>();

  /**
   * Registers a class and creates scoped access to session and local storage.
   * 
   * @param any The class constructor used for scoping keys.
   * @returns An object providing access to both session and local storage.
   * @throws {DuplicateClassError} If the class has already been registered.
   */
  public instance(any: AnyConstructor): StorageService.Storages {
    if (this.knownClasses.has(any)) throw new DuplicateClassError(any);
    this.knownClasses.add(any);
    return {
      session: this.constructStorage(any, window.sessionStorage),
      local: this.constructStorage(any, window.localStorage),
    };
  }

  /**
   * Constructs a scoped storage key.
   * 
   * @param any The class constructor used for scoping.
   * @param key The specific key to scope.
   * @returns A prefixed string key for storage.
   */
  private constructKey(any: AnyConstructor, key: string): string {
    return `${PREFIX}-${any.name}-${key}`;
  }

  /**
   * Creates a storage object with scoped get, set, remove, and take methods.
   * 
   * @param any - The class constructor used for key scoping.
   * @param storage - The browser storage (sessionStorage or localStorage).
   * @returns A `Storage` interface providing scoped storage operations.
   */
  private constructStorage(
    any: AnyConstructor,
    storage: Storage,
  ): StorageService.Storage {
    let k = (key: string) => this.constructKey(any, key);
    return {
      get: (key: string) => storage.getItem(k(key)),
      set: (key: string, value: string) => storage.setItem(k(key), value),
      remove: (key: string) => storage.removeItem(k(key)),
      take: (key: string) => {
        let value = storage.getItem(k(key));
        storage.removeItem(k(key));
        return value;
      },
    };
  }
}

export namespace StorageService {
  /** Interface for scoped storage operations. */
  export interface Storage {
    /**
     * Retrieves a value from storage.
     * @param key The key to retrieve.
     * @returns The stored value or null if not found.
     */
    get(key: string): string | null;

    /**
     * Stores a value in storage.
     * @param key The key to store.
     * @param value The value to store.
     */
    set(key: string, value: string): void;

    /**
     * Removes a value from storage.
     * @param key The key to remove.
     */
    remove(key: string): void;

    /**
     * Retrieves and removes a value from storage.
     * @param key The key to retrieve and remove.
     * @returns The stored value or null if not found.
     */
    take(key: string): string | null;
  }

  /** Interface for access to both session and local storage. */
  export interface Storages {
    /** Session storage scoped for the provided class. */
    session: Storage;

    /** Local storage scoped for the provided class. */
    local: Storage;
  }
}

/**
 * Error thrown when a class is registered more than once in `StorageService`.
 */
class DuplicateClassError extends Error {
  /** The duplicate class constructor. */
  class: AnyConstructor;

  /**
   * Creates a new `DuplicateClassError`.
   * 
   * @param any The class constructor causing the duplicate error.
   */
  constructor(any: AnyConstructor) {
    let message = `Duplicate class in StorageService. ${any.name} already known.`;
    super(message);
    this.name = DuplicateClassError.name;
    this.class = any;
  }
}
