export class Scopes {
  private totalWildcard: boolean;
  private scopes: Record<Scopes.Service, Record<Scopes.Level, boolean>> = {};

  constructor(scopes: Scopes.Scope[]) {
    this.totalWildcard = scopes.includes("*:*");

    for (let scope of scopes) {
      let [service, level] = Scopes.split(scope);
      if (!this.scopes[service])
        this.scopes[service] = {
          read: false,
          write: false,
          delete: false,
          "*": false,
        };

      this.scopes[service][level] = true;
    }
  }

  static split(scope: Scopes.Scope): [Scopes.Service, Scopes.Level] {
    let split = scope.split(":");
    let level = split.pop();
    let service = split.join(":");
    return [service, level] as [Scopes.Service, Scopes.Level];
  }

  /**
   * Checks if passed scopes are all present.
   *
   * If a scope says `"*"` for the level, it matches any level.
   * If the service is `"*"`, it matches any service.
   * A `"*:*"` scope lets the user do everything.
   *
   * @param scopes A list of strings like `"service:read"`, `"service:write"`,
   *               or `"*:*"`.
   *
   * @example
   * if (scopes.has("orders:read", "users:write")) {
   *   // user can read orders and write users
   * }
   */
  has(...scopes: Scopes.Scope[]): boolean {
    if (this.totalWildcard) return true;

    for (let scope of scopes) {
      let [service, level] = Scopes.split(scope);
      if (this.scopes[service]["*"]) continue;
      if (this.scopes[service][level]) continue;
      return false;
    }

    return true;
  }
}

export namespace Scopes {
  export type Service = string;
  export type Level = "read" | "write" | "delete" | "*";
  export type Scope = `${Service}:${Level}`;
}
