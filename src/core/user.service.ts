import {HttpClient, HttpContext} from "@angular/common/http";
import {signal, Injectable, effect} from "@angular/core";
import {JTDDataType} from "ajv/dist/jtd";
import {firstValueFrom} from "rxjs";

import {httpContexts} from "../common/http-contexts";
import { AuthService } from "./auth/auth.service";

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
    }, {allowSignalWrites: true});
  }

  async fetchUserDetails(userId: string = "me") {
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
  }
}

export namespace UserService {
  export type UserDetails = JTDDataType<typeof USER_DETAILS_SCHEMA>;
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
    permissions: {values: {elements: {type: "string"}}}
  },
} as const;