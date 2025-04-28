import {HttpClient, HttpContext, HttpParams} from "@angular/common/http";
import {computed, signal, Injectable} from "@angular/core";
import {Router} from "@angular/router";
import {jwtDecode} from "jwt-decode";
import {firstValueFrom} from "rxjs";
import typia from "typia";

import {Scopes} from "./scopes";
import {StorageService} from "../../common/storage.service";
import {httpContexts} from "../../common/http-contexts";

const API_URL = "/api/auth";

const ACCESS_TOKEN_KEY = "access";
const REFRESH_TOKEN_KEY = "refresh";
const REMEMBER_LOGIN_KEY = "remember";
const CURRENT_URL_KEY = "url";

@Injectable({
  providedIn: "root",
})
export class AuthService {
  readonly RefreshTokenError = RefreshTokenError;

  private storage: StorageService.Storages;

  readonly accessToken = signal<string | null>(null);
  readonly refreshToken = signal<string | null>(null);

  readonly decodedAccessToken = computed(() => {
    let accessToken = this.accessToken();
    if (!accessToken) return null;
    let decoded = jwtDecode<JwtPayload>(accessToken);
    return typia.assert<JwtPayload>(decoded);
  });

  readonly scopes = computed(() => {
    let scopes = this.decodedAccessToken()?.["scopes"] ?? [];
    return new Scopes(scopes as Scopes.Scope[]);
  });

  constructor(
    private http: HttpClient,
    private router: Router,
    storage: StorageService,
  ) {
    this.storage = storage.instance(AuthService);
    this.loadTokens();
  }

  loadTokens() {
    let accessToken =
      this.storage.session.get(ACCESS_TOKEN_KEY) ??
      this.storage.local.get(ACCESS_TOKEN_KEY);
    let refreshToken =
      this.storage.session.get(REFRESH_TOKEN_KEY) ??
      this.storage.local.get(REFRESH_TOKEN_KEY);

    if (accessToken && refreshToken) {
      this.accessToken.set(accessToken);
      this.refreshToken.set(refreshToken);
    }
  }

  login(remember: boolean = true) {
    this.storage.session.set(REMEMBER_LOGIN_KEY, JSON.stringify(remember));
    this.storage.session.set(CURRENT_URL_KEY, this.router.url);
    let origin = window.location.origin;
    let redirectUri = `${origin}/callback`;
    let navigateUrl = `${origin}${API_URL}/login?redirect_uri=${redirectUri}`;
    window.location.assign(navigateUrl);
  }

  async callback(code: string, state: string) {
    let tokenSet = await this.generateTokenSet(
      "authorization_code",
      code,
      state,
    );

    this.storeTokenSet(tokenSet);

    let redirect = this.storage.session.take(CURRENT_URL_KEY);
    return redirect;
  }

  async logout() {
    this.storage.session.remove(ACCESS_TOKEN_KEY);
    this.storage.local.remove(ACCESS_TOKEN_KEY);
    this.storage.session.remove(REFRESH_TOKEN_KEY);
    this.storage.local.remove(REFRESH_TOKEN_KEY);

    let refreshToken = this.refreshToken();
    if (refreshToken) {
      let params = new HttpParams().set("token", refreshToken);
      try {
        await firstValueFrom(this.http.post(`${API_URL}/revoke`, params));
      } catch {}
    }

    this.accessToken.set(null);
    this.refreshToken.set(null);

    this.router.navigateByUrl("/");
  }

  async refresh() {
    let refreshToken =
      this.storage.session.get(REFRESH_TOKEN_KEY) ??
      this.storage.local.get(REFRESH_TOKEN_KEY);
    if (!refreshToken) throw new RefreshTokenError({missing: true});

    // TODO: try-catch this
    let tokenSet = await this.generateTokenSet("refresh_token", refreshToken);
    this.storeTokenSet(tokenSet);
  }

  storeTokenSet(tokenSet: AuthService.TokenSet) {
    let storedRemember = this.storage.session.take(REMEMBER_LOGIN_KEY);
    let remember = storedRemember ? JSON.parse(storedRemember) : false;

    if (remember) {
      this.storage.local.set(ACCESS_TOKEN_KEY, tokenSet.accessToken);
      this.storage.local.set(REFRESH_TOKEN_KEY, tokenSet.refreshToken);
    } else {
      this.storage.session.set(ACCESS_TOKEN_KEY, tokenSet.accessToken);
      this.storage.session.set(REFRESH_TOKEN_KEY, tokenSet.refreshToken);
    }

    this.accessToken.set(tokenSet.accessToken);
    this.refreshToken.set(tokenSet.refreshToken);
  }

  async generateTokenSet(
    grantType: "refresh_token",
    refreshToken: string,
  ): Promise<AuthService.TokenSet>;
  async generateTokenSet(
    grantType: "authorization_code",
    code: string,
    state: string,
  ): Promise<AuthService.TokenSet>;
  async generateTokenSet(
    grantType: "authorization_code" | "refresh_token",
    ...data: string[]
  ): Promise<AuthService.TokenSet> {
    let params = new HttpParams();
    params = params.set("grant_type", grantType);
    switch (grantType) {
      case "refresh_token":
        params = params.set("refresh_token", data[0]);
        break;
      case "authorization_code":
        params = params.set("code", data[0]);
        params = params.set("state", data[1]);
        break;
    }

    let response = await firstValueFrom(
      this.http.post<RawTokenSet>(`${API_URL}/token`, params, {
        context: new HttpContext()
          .set(httpContexts.validateType, typia.createValidate<RawTokenSet>())
          .set(httpContexts.authenticate, false),
      }),
    );

    if (response.token_type.trim().toLowerCase() !== "bearer") {
      console.warn("Response token type wasn't 'bearer'");
    }

    return {
      accessToken: response.access_token,
      expiresIn: response.expires_in,
      tokenType: "bearer",
      refreshToken: response.refresh_token,
    };
  }
}

type RawTokenSet = {
  access_token: string;
  expires_in: number & typia.tags.Type<"int32">;
  token_type: string;
  refresh_token: string;
};

type JwtPayload = {
  aud: string[];
  exp: number & typia.tags.Type<"uint32">;
  iss: string;
  nbf: number & typia.tags.Type<"uint32">;
  scopes: string[];
  sub: string;
  iat?: number & typia.tags.Type<"uint32">;
  jti?: string;
};

export namespace AuthService {
  export interface TokenSet {
    accessToken: string;
    expiresIn: number;
    tokenType: "bearer";
    refreshToken: string;
  }
}

class RefreshTokenError extends Error {
  constructor(why: {missing?: boolean; expired?: boolean}) {
    let message = "Refreshing tokens failed.";
    if (why.missing) message += " No refresh token stored.";
    if (why.expired) message += " Refresh token expired.";
    super(message);
    this.name = RefreshTokenError.name;
  }
}
