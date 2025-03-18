import {inject} from "@angular/core";
import {CanActivateFn, Router, UrlTree} from "@angular/router";

/**
 * A route guard that ensures required query parameters are present before 
 * allowing access.
 *
 * This function takes one or more required query parameters and returns a 
 * {@link CanActivateFn}.
 * If any required query parameter is missing, the user is redirected to a 
 * specified route.
 *
 * @param required A single query parameter or an array of query parameters that 
 *                 must be present.
 * @param redirectTo A path or {@link UrlTree} to redirect to if any required 
 *                   parameter is missing.
 *                   If not provided, the guard simply denies access.
 *
 * @example
 * import {Route} from "@angular/router";
 *
 * const route: Route = {
 *   path: "filter-results",
 *   component: FilteredListComponent,
 *   canActivate: [queryParameterGuard(["category", "sort"], "/choose-filters")],
 * };
 */
export function queryParameterGuard(
  required: string | string[],
  redirectTo?: string | UrlTree,
): CanActivateFn {
  return (route, _state) => {
    let router = inject(Router);
    let redirect = redirectTo ?? false;
    if (typeof redirectTo == "string") redirect = router.parseUrl(redirectTo);

    let queryParams = route.queryParamMap;
    for (let requiredParam of [required].flat()) {
      if (!queryParams.has(requiredParam)) return redirect as boolean | UrlTree;
    }

    return true;
  };
}
