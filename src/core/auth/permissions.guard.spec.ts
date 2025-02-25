import {TestBed} from "@angular/core/testing";
import {
  CanActivateFn,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from "@angular/router";

import {permissionsGuard} from "./permissions.guard";
import {UserService} from "../user.service";

describe("permissionsGuard", () => {
  const userDetails = jest.fn();
  const route: ActivatedRouteSnapshot = null as any;
  const state: RouterStateSnapshot = null as any;

  beforeEach(() => {
    const userServiceMock = {userDetails};
    TestBed.configureTestingModule({
      providers: [{provide: UserService, useValue: userServiceMock}],
    });
  });

  function permissionsGuardInContext(
    ...scopes: permissionsGuard.Scope[]
  ): CanActivateFn {
    let guard = permissionsGuard(...scopes);
    return (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) =>
      TestBed.runInInjectionContext(() => guard(route, state));
  }

  it("should pass empty guards", () => {
    const guard = permissionsGuardInContext();
    expect(guard(route, state)).toBe(true);
  });

  it("should allow access if user has the correct permission", () => {
    userDetails.mockReturnValue({
      permissions: {
        service: ["read"],
      },
    });

    const guard = permissionsGuardInContext("service:read");
    expect(guard(route, state)).toBe(true);
  });

  it("should deny access if user does not have the correct permission", () => {
    userDetails.mockReturnValue({
      permissions: {
        service: ["write"],
      },
    });

    const guard = permissionsGuardInContext("service:read");
    expect(guard(route, state)).toBe(false);
  });

  it("should allow access if user has wildcard permission", () => {
    userDetails.mockReturnValue({
      permissions: {
        "*": ["*"],
      },
    });

    const guard = permissionsGuardInContext("service:read");
    expect(guard(route, state)).toBe(true);
  });

  it("should deny access if user has wildcard but wrong level", () => {
    userDetails.mockReturnValue({
      permissions: {
        "*": ["write"],
      },
    });

    const guard = permissionsGuardInContext("service:read");
    expect(guard(route, state)).toBe(false);
  });

  it("should allow access if user has all required permissions", () => {
    userDetails.mockReturnValue({
      permissions: {
        service: ["read", "write"],
      },
    });

    const guard = permissionsGuardInContext("service:read", "service:write");
    expect(guard(route, state)).toBe(true);
  });

  it("should deny access if user does not have all required permissions", () => {
    userDetails.mockReturnValue({
      permissions: {
        service: ["read"],
      },
    });

    const guard = permissionsGuardInContext("service:read", "service:write");
    expect(guard(route, state)).toBe(false);
  });

  it("should pass for any permission if no scopes are required", () => {
    userDetails.mockReturnValue({
      permissions: {
        "service:read": ["read"],
      },
    });

    const guard = permissionsGuardInContext();
    expect(guard(route, state)).toBe(true);
  });
});
