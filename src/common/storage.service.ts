import {Injectable} from "@angular/core";

const PREFIX = "wisdom-oss/frontend";
type AnyConstructor = new (...args: any[]) => any;

@Injectable({
  providedIn: "root",
})
export class StorageService {
  // Error type re-export for namespacing.
  DuplicateClassError = DuplicateClassError;

  private knownClasses = new Set<AnyConstructor>();

  public instance(any: AnyConstructor): StorageService.Storages {
    if (this.knownClasses.has(any)) throw new DuplicateClassError(any);
    this.knownClasses.add(any);
    return {
      session: this.constructStorage(any, window.sessionStorage),
      local: this.constructStorage(any, window.localStorage),
    };
  }

  private constructKey(any: AnyConstructor, key: string): string {
    return `${PREFIX}-${any.name}-${key}`;
  }

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
  export interface Storage {
    get(key: string): string | null;
    set(key: string, value: string): void;
    remove(key: string): void;
    take(key: string): string | null;
  }

  export interface Storages {
    session: Storage;
    local: Storage;
  }
}

class DuplicateClassError extends Error {
  class: AnyConstructor;

  constructor(any: AnyConstructor) {
    let message = `Duplicate class in StorageService. ${any.name} already known.`;
    super(message);
    this.name = DuplicateClassError.name;
    this.class = any;
  }
}
