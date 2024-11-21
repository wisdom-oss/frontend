import {HttpClient, HttpContext, HttpParams} from "@angular/common/http";
import {computed, signal, Injectable} from "@angular/core";
import {ActivatedRoute, Router} from "@angular/router";
import Ajv, {JSONSchemaType} from "ajv";
import {JTDDataType} from "ajv/dist/core";
import {jwtDecode} from "jwt-decode";
import {firstValueFrom} from "rxjs";

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

  // TODO: outsource this into a service
  private ajv = new Ajv();

  private storage: StorageService.Storages;

  private accessToken = signal<string | undefined>(undefined);
  private refreshToken = signal<string | undefined>(undefined);

  private decodedAccessToken = computed(() => {
    let accessToken = this.accessToken();
    if (!accessToken) return undefined;
    return jwtDecode(accessToken);
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
    let redirectUri = `${window.location.origin}/callback`;
    this.router.navigateByUrl(`/api/auth/login?redirect_uri=${redirectUri}`);
  }

  async callback(code: string, state: string) {
    let tokenSet = await this.generateTokenSet(
      "authorization_code",
      code,
      state,
    );

    this.storeTokenSet(tokenSet);

    let redirect = this.storage.session.take(CURRENT_URL_KEY);
    if (redirect) this.router.navigateByUrl(redirect);
  }

  logout() {}

  async refresh() {
    let refreshToken =
      this.storage.session.get(REFRESH_TOKEN_KEY) ??
      this.storage.local.get(REFRESH_TOKEN_KEY);
    if (!refreshToken) throw new RefreshTokenError({missing: true});

    // TODO: try-catch this
    await this.generateTokenSet("refresh_token", refreshToken);
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
    params.set("grant_type", grantType);
    switch (grantType) {
      case "refresh_token":
        params.set("refresh_token", data[0]);
        break;
      case "authorization_code":
        params.set("code", data[0]);
        params.set("state", data[1]);
        break;
    }

    let response = await firstValueFrom(
      this.http.post<JTDDataType<typeof TOKEN_SET_SCHEMA>>(
        `${API_URL}/token`,
        params,
        {
          context: new HttpContext().set(
            httpContexts.validateSchema,
            TOKEN_SET_SCHEMA,
          ),
        },
      ),
    );

    return {
      accessToken: response.access_token,
      expiresIn: response.expires_in,
      tokenType: "bearer",
      refreshToken: response.refresh_token,
    };
  }
}

const TOKEN_SET_SCHEMA = {
  properties: {
    access_token: {type: "string"},
    expires_in: {type: "int32"},
    token_type: {enum: ["bearer"]},
    refresh_token: {type: "string"},
  },
} as const;

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