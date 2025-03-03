import {TestBed} from "@angular/core/testing";
import {UserService} from "./user.service";
import { HttpClient } from "@angular/common/http";
import { AuthService } from "./auth/auth.service";

describe("UserService.hasPermissions", () => {
  let userService: UserService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {provide: HttpClient, useValue: null},
        {provide: AuthService, useValue: null},
      ],
    });

    userService = TestBed.inject(UserService);
  });

  it("should return true if no scopes are required", () => {
    expect(userService.hasPermissions()).toBe(true);
  });

  it("should return true if user has the correct permissions", () => {
    jest.spyOn(userService, "userDetails").mockReturnValue({
      permissions: {
        service: ["read"],
      },
    } as any);

    expect(userService.hasPermissions("service:read")).toBe(true);
  });

  it("should return false if user does not have the correct permission", () => {
    jest.spyOn(userService, "userDetails").mockReturnValue({
      permissions: {
        service: ["write"],
      },
    } as any);

    expect(userService.hasPermissions("service:read")).toBe(false);
  });

  it("should return true if user has wildcard permission", () => {
    jest.spyOn(userService, "userDetails").mockReturnValue({
      permissions: {
        "*": ["*"],
      },
    } as any);

    expect(userService.hasPermissions("service:read")).toBe(true);
  });

  it("should return false if user has wildcard but wrong level", () => {
    jest.spyOn(userService, "userDetails").mockReturnValue({
      permissions: {
        "*": ["write"],
      },
    } as any);

    expect(userService.hasPermissions("service:read")).toBe(false);
  });

  it("should return true if user has all required permissions", () => {
    jest.spyOn(userService, "userDetails").mockReturnValue({
      permissions: {
        service: ["read", "write"],
      },
    } as any);

    expect(userService.hasPermissions("service:read", "service:write")).toBe(true);
  });

  it("should return false if user does not have all required permissions", () => {
    jest.spyOn(userService, "userDetails").mockReturnValue({
      permissions: {
        service: ["read"],
      },
    } as any);

    expect(userService.hasPermissions("service:read", "service:write")).toBe(false);
  });
});
