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
}

export namespace UserService {
  export type UserDetails = Omit<
    JTDDataType<typeof USER_DETAILS_SCHEMA>,
    "permissions"
  > & {
    /** @deprecated Use {@link AuthService.scopes()} instead. */
    permissions: Record<string, string[]>;
  };
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
