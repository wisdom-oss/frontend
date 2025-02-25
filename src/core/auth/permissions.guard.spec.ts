import { TestBed } from "@angular/core/testing";
import { WritableSignal } from "@angular/core";
import { permissionsGuard } from "./permissions.guard";
import { ActivatedRouteSnapshot, RouterStateSnapshot } from "@angular/router";

jest.mock("../user.service", () => {{
  UserService: jest.fn().mockImplementation(() => {{
    userDetails: null as any as WritableSignal<UserService.UserDetails | null>
  }})
}});

// this is now mocked
import { UserService } from "../user.service";


describe("permissionsGuard", () => {

  const route: ActivatedRouteSnapshot = null as any;
  const state: RouterStateSnapshot = null as any;

  beforeEach(() => {
    TestBed.configureTestingModule({providers: [{provide: UserService, useValue: new UserService(null as any, null as any)}]});
  });

  it("should pass empty guards", () => {
    const guard = permissionsGuard();
    expect(guard(route, state)).toBe(true);
  });
});
