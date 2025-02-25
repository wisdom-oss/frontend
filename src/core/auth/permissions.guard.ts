import {inject} from "@angular/core";
import {CanActivateFn} from "@angular/router";

import {UserService} from "../user.service";

/**
 * A route guard that checks if a user has the required permissions to access a
 * route.
 *
 * This function accepts a list of required permissions (scopes) and returns a
 * {@link CanActivateFn}.
 * All specified scopes must be satisfied for access to be granted.
 * - The `*` level allows any permission level.
 * - The `*` service allows any service.
 * - The `*:*` permission grants access to all permissions.
 *
 * @param scopes A list of permission scopes in the format `<service>:<level>`,
 *               where `level` can be `read`, `write`, `delete`, or `*`.
 *
 * @example
 * import {Route} from "@angular/router";
 *
 * const route: Route = {
 *   path: "secret-path",
 *   component: SecretComponent,
 *   canActivate: [permissionsGuard("service:read")],
 * };
 */
export function permissionsGuard(
  ...scopes: permissionsGuard.Scope[]
): CanActivateFn {
  return (_route, _state) => {
    let userService = inject(UserService);
    let userPermissions = userService.userDetails()?.permissions ?? {};

    for (let scope of scopes) {
      let split = scope.split(":");
      let level = split.pop()!; // scope type enforces that a level must exist
      let service = split.join(":");

      let userLevels = userPermissions[service] ?? userPermissions["*"] ?? [];
      if (userLevels.includes("*")) continue;
      if (!userLevels.includes(level)) {
        return false;
      }
    }

    return true;
  };
}

export namespace permissionsGuard {
  export type Service = string;
  export type Level = "read" | "write" | "delete" | "*";
  export type Scope = `${Service}:${Level}`;
}
