/**
 * @file
 * Proxy configuration for local development.
 *
 * Angular automatically loads this proxy configuration when starting a dev
 * server to handle API requests. By default, all requests starting with `/api/`
 * are forwarded to the main server.
 *
 * While developing backend services locally, additional proxy configurations
 * can be defined for local testing. You can add a custom proxy by defining
 * a new entry in {@link OPTIONAL_PROXY_CONFIGS}.
 *
 * To enable specific proxies, set the {@link ENV_VAR_NAME} environment variable
 * to a comma-separated list of the proxies you want to use when running
 * `ng serve`.
 *
 * @example
 * WISDOM_FRONTEND_DEV_PROXIES=bws,geo ng serve
 */

const didYouMean = require("didyoumean");
didYouMean.threshold = 0.2;
didYouMean.thresholdAbsolute = 10;
didYouMean.caseSensitive = true;

/** @typedef {import("vite").ProxyOptions} ProxyOptions */

/** Environment variable for specifying additional optional proxies. */
const ENV_VAR_NAME = "WISDOM_FRONTEND_DEV_PROXIES";

/**
 * Optional proxy configurations.
 *
 * Each entry defines a named proxy that can be selectively enabled by including
 * its name in the {@link ENV_VAR_NAME} variable.
 *
 * @type {Record<string, [string, ProxyOptions]>}
 */
const OPTIONAL_PROXY_CONFIGS = {
  /** Proxy for Be-Water-Smart API (localhost:5000). */
  bws: [
    "/api/bws/**",
    {
      target: "http://localhost:5000",
      secure: false,
      rewrite: path => path.replace(/^\/api\/bws/, ""),
    },
  ],
};

/**
 * Default proxy configuration.
 *
 * This forwards all `/api/` requests to the main server while changing the
 * origin to bypass CORS restrictions.
 *
 * @type {Record<string, ProxyOptions>}
 */
const PROXY_CONFIG = {
  "/api/**": {
    target: "https://wisdom-demo.uol.de/api",
    secure: false,
    changeOrigin: true,
    rewrite: path => path.replace(/^\/api/, ""),
  },
};

/**
 * Active proxy configuration, including optional proxies if specified.
 *
 * If an unknown proxy name is provided, a warning will be displayed with a
 * suggestion for a similar known proxy.
 *
 * @type {Record<string, ProxyOptions>}
 */
const proxies = {};
for (const entry of (process.env[ENV_VAR_NAME] ?? "").split(",")) {
  const key = entry.trim();
  if (!key.length) continue;
  const proxy = OPTIONAL_PROXY_CONFIGS[key];

  if (!proxy) {
    const suggestion = didYouMean(key, Object.keys(OPTIONAL_PROXY_CONFIGS));
    if (suggestion) {
      console.warn(`Unknown proxy "${key}". Did you mean "${suggestion}"?`);
      continue;
    }

    const available = Object.keys(OPTIONAL_PROXY_CONFIGS)
      .map(p => `"${p}"`)
      .join(", ");
    console.warn(`Unknown proxy "${key}". Expected one of: ${available}.`);
    continue;
  }

  proxies[proxy[0]] = proxy[1];
}

module.exports = {...proxies, ...PROXY_CONFIG};
