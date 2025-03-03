import {HttpClient, HttpContext} from "@angular/common/http";
import {effect, signal, Injectable} from "@angular/core";
import {JTDDataType} from "ajv/dist/jtd";
import {firstValueFrom} from "rxjs";

import {AuthService} from "./auth/auth.service";
import {httpContexts} from "../common/http-contexts";

const API_URL = "/api/auth";

@Injectable({
  providedIn: "root",
})
export class UserService {
  readonly userDetails = signal<UserService.UserDetails | null>(null);

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {
    effect(() => {
      if (this.authService.accessToken()) this.fetchUserDetails();
      else this.userDetails.set(null);
    });
  }

  async fetchUserDetails(userId: string = "me") {
    try {
      let userDetails = await firstValueFrom(
        this.http.get<UserService.UserDetails>(`${API_URL}/users/${userId}`, {
          context: new HttpContext().set(
            httpContexts.validateSchema,
            USER_DETAILS_SCHEMA,
          ),
        }),
      );

      this.userDetails.set(userDetails);
      return userDetails;
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  /**
   * Checks if the user has all given permission scopes.
   * 
   * If a scope says `"*"` for the level, it matches any level. 
   * If the service is `"*"`, it matches any service. 
   * A `"*:*"` scope lets the user do everything.
   *
   * @param scopes A list of strings like `"service:read"`, `"service:write"`, 
   *               or `"*:*"`.
   *
   * @example
   * if (userService.hasPermissions("orders:read", "users:write")) {
   *   // user can read orders and write users
   * }
   */
  hasPermissions(...scopes: UserService.Scope[]): boolean {
    let userPermissions = this.userDetails()?.permissions ?? {};
    
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
  }
}

export namespace UserService {
  export type UserDetails = JTDDataType<typeof USER_DETAILS_SCHEMA>;

  export type Service = string;
  export type Level = "read" | "write" | "delete" | "*";
  export type Scope = `${Service}:${Level}`;
}

const USER_DETAILS_SCHEMA = {
  properties: {
    id: {type: "string"},
    externalIdentifier: {type: "string"},
    name: {type: "string"},
    email: {type: "string"},
    username: {type: "string"},
    disabled: {type: "boolean"},
    administrator: {type: "boolean"},
    permissions: {values: {elements: {type: "string"}}},
  },
} as const;
