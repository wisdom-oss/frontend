import {DOCUMENT} from "@angular/common";
import {HttpClient} from "@angular/common/http";
import {inject, provideAppInitializer} from "@angular/core";
import {
  addProtocol,
  AddProtocolAction,
  RequestParameters,
  GetResourceResponse,
} from "maplibre-gl";
import {firstValueFrom} from "rxjs";

/**
 * Provides global settings for MapLibre.
 *
 * This provider is designed to configure MapLibre globally, ensuring that
 * custom settings are applied before the application initializes.
 */
export const provideMaplibreSettings = () =>
  provideAppInitializer(() => {
    addOriginProtocol();
  });

/**
 * Adds the `origin://` protocol to MapLibre, enabling requests relative to
 * the application's origin.
 *
 * This protocol allows specifying resources using `origin://` instead of an
 * absolute URL.
 * It automatically resolves to the current origin (e.g., `http://localhost` in
 * development or `https://example.com` in production), making deployment
 * environment-agnostic.
 *
 * @throws Error if the request method is not `GET`.
 */
function addOriginProtocol() {
  const document = inject(DOCUMENT);
  const http = inject(HttpClient);

  const action: AddProtocolAction = async (
    requestParameters: RequestParameters,
    _abortController: AbortController,
  ): Promise<GetResourceResponse<any>> => {
    if (requestParameters.method ?? "GET" != "GET") {
      throw new Error("only GET is implemented for the `origin` protocol");
    }

    const origin = document.location.origin;
    const url = origin + "/" + requestParameters.url.split("://")[1];

    let response;
    switch (requestParameters.type) {
      case "arrayBuffer":
        response = await firstValueFrom(
          http.get(url, {responseType: "arraybuffer"}),
        );
        return {data: response};
      case "image":
        response = await firstValueFrom(http.get(url, {responseType: "blob"}));
        let data = await createImageBitmap(response);
        return {data};
      case "json":
        response = await firstValueFrom(http.get(url, {responseType: "json"}));
        return {data: response};
      case "string":
        response = await firstValueFrom(http.get(url, {responseType: "text"}));
        return {data: response};
      default:
        response = http.get(url);
        return {data: response};
    }
  };

  addProtocol("origin", action);
}
