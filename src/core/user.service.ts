import {HttpClient, HttpContext} from "@angular/common/http";
import {effect, signal, Injectable} from "@angular/core";
import {firstValueFrom} from "rxjs";
import typia from "typia";

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
            httpContexts.validateType,
            typia.createValidate<UserService.UserDetails>(),
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
  export type UserDetails = {
    id: string;
    externalIdentifier: string;
    name: string;
    email: string;
    username: string;
    disabled: boolean;
    administrator: boolean;
    /** @deprecated Use {@link AuthService.scopes()} instead. */
    permissions: Record<string, string[]>;
  };
}
