/**
 * Production environment configuration.
 *
 * Used for production builds (`NODE_ENV === 'production'`).
 * Set `apiBaseUrl` to the public base URL of the published ASP.NET Core backend.
 * Do NOT use a trailing slash unless the backend is configured behind that exact path.
 */
export const environment = {
  production: true,
  apiBaseUrl: 'https://api.yourdomain.com/api',
};

/**
 * Public URL the application is accessed from in production.
 * Used to build absolute links in emails, notifications, and frontend redirects.
 */
export const clientBaseUrl = 'https://app.yourdomain.com';
