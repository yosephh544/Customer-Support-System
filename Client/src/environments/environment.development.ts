/**
 * Development overrides for the environment files.
 *
 * Vite resolves this file automatically in development mode (`NODE_ENV === 'development'`),
 * so the dev server proxies `/api` to `http://localhost:5163`.
 */
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:5163/api',
};

export const clientBaseUrl = 'http://localhost:5173';
