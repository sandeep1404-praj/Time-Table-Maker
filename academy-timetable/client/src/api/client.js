import axios from "axios";

const PRODUCTION_API = "https://time-table-maker.onrender.com";
const LOCAL_API = "http://localhost:4000";

/**
 * Resolve the API base URL:
 *  1. Use VITE_API_URL if explicitly set (e.g. on Netlify with the env var configured).
 *  2. If running on a non-localhost origin (i.e. deployed on Netlify / any CDN),
 *     always use the production Render URL.
 *  3. Otherwise (local dev) use localhost — requests that fail will be retried
 *     against the production URL by the response interceptor below.
 */
function resolveBaseURL() {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // If the page itself is not served from localhost, we are deployed.
  if (
    typeof window !== "undefined" &&
    !window.location.hostname.includes("localhost") &&
    !window.location.hostname.includes("127.0.0.1")
  ) {
    return PRODUCTION_API;
  }
  // Local development — prefer localhost, with fallback handled below.
  return LOCAL_API;
}

const api = axios.create({
  baseURL: resolveBaseURL()
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem("authToken");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // ── Localhost fallback ──────────────────────────────────────────────────
    // If the request was sent to localhost and failed due to a network error
    // (i.e. local server is not running), transparently retry against the
    // production Render API so the app still works without a local backend.
    const requestURL = error?.config?.baseURL || error?.config?.url || "";
    const isLocalRequest =
      requestURL.includes("localhost") || requestURL.includes("127.0.0.1");
    const isNetworkError = !error.response; // no response = connection refused / offline

    if (isLocalRequest && isNetworkError && error.config && !error.config.__retriedWithProduction) {
      error.config.__retriedWithProduction = true;
      error.config.baseURL = PRODUCTION_API;
      // Strip localhost prefix from the url if it was baked in
      if (error.config.url?.startsWith(LOCAL_API)) {
        error.config.url = error.config.url.replace(LOCAL_API, PRODUCTION_API);
      }
      return axios(error.config);
    }
    // ────────────────────────────────────────────────────────────────────────

    if (error?.response?.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new Event("auth:logout"));
    }

    return Promise.reject(error);
  }
);

export default api;
