import {inject} from "@angular/core";
import {CanActivateFn} from "@angular/router";

import {Scopes} from "./scopes";
import {AuthService} from "./auth.service";

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
export function permissionsGuard(...scopes: Scopes.Scope[]): CanActivateFn {
  return (_route, _state) => {
    return inject(AuthService)
      .scopes()
      .has(...scopes);
  };
}
