/**
 * Application-wide environment configuration.
 *
 * Path alias: @env/environments
 *
 * Development builds (Vite dev server on :5173) load `environment.development.ts`
 * and override `apiBaseUrl` with the local backend URL.
 * Production builds load `environment.prod.ts` with the real backend origin.
 *
 * NOTE: `CLIENT_BASE_URL` is the public URL the UI is served from. Do NOT put a
 * trailing slash here - it is concatenated with endpoint paths in the API layer.
 */
export const environment = {
  production: false,
  // Base URL of the backend API (including the /api route prefix)
  apiBaseUrl: 'http://localhost:5163/api',
};

/**
 * Base URL used to build absolute links for emails, notifications, and
 * frontend redirects. Matches the public URL the app is accessed at.
 */
export const clientBaseUrl = 'http://localhost:5173';
