import type { ApiResponse } from '../types';

const API_BASE = '/api';

export class ApiError extends Error {
  statusCode: number;
  errors?: string[];
  fieldErrors?: Record<string, string[]>;

  constructor(
    message: string,
    statusCode: number,
    errors?: string[],
    fieldErrors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
    this.fieldErrors = fieldErrors;
  }
}

/**
 * Parses any backend error response (ASP.NET ProblemDetails, ApiResponse, or plain strings)
 * into a clear, user-friendly message and list of field-level errors.
 */
export function parseApiError(
  raw: any,
  statusCode: number,
  fallbackText: string,
  isLoginEndpoint: boolean = false
): { message: string; errors?: string[]; fieldErrors?: Record<string, string[]> } {
  // Always prioritize the message returned by the API if present
  if (raw && typeof raw === 'object' && raw.message) {
    return {
      message: raw.message,
      errors: Array.isArray(raw.errors) ? raw.errors : undefined,
    };
  }

  if (statusCode === 401 && isLoginEndpoint) {
    return {
      message: 'Invalid username or password.',
    };
  }

  if (statusCode === 403) {
    return {
      message: 'Access denied: You do not have permission to perform this action.',
    };
  }

  if (statusCode === 404) {
    return {
      message: 'The requested resource was not found.',
    };
  }

  if (!raw) {
    return {
      message: fallbackText || (statusCode >= 500 ? 'Server error. Please try again later.' : 'An unexpected error occurred.'),
    };
  }

  const collectedErrors: string[] = [];
  const fieldErrors: Record<string, string[]> = {};

  // Check ASP.NET ValidationProblemDetails "errors" dictionary { Username: ["Required"] }
  if (raw.errors) {
    if (Array.isArray(raw.errors)) {
      raw.errors.forEach((e: any) => collectedErrors.push(String(e)));
    } else if (typeof raw.errors === 'object') {
      for (const [key, val] of Object.entries(raw.errors)) {
        if (Array.isArray(val)) {
          const list = val.map(String);
          fieldErrors[key] = list;
          collectedErrors.push(...list);
        } else if (typeof val === 'string') {
          fieldErrors[key] = [val];
          collectedErrors.push(val);
        }
      }
    }
  }

  // Find primary human-readable message
  let primaryMessage = raw.message || raw.title || raw.error || raw.detail;

  if (!primaryMessage && collectedErrors.length > 0) {
    primaryMessage = collectedErrors[0];
  }

  if (!primaryMessage) {
    primaryMessage = fallbackText || `Request failed (HTTP ${statusCode})`;
  }

  return {
    message: primaryMessage,
    errors: collectedErrors.length > 0 ? collectedErrors : undefined,
    fieldErrors: Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined,
  };
}

export async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('auth_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (err: any) {
    // Network failure / server offline
    const isOffline =
      err?.name === 'TypeError' ||
      err?.message?.includes('fetch') ||
      err?.message?.includes('Failed');
    if (isOffline) {
      throw new ApiError(
        'Unable to connect to the backend server. Please verify the API is running at http://localhost:5163.',
        0
      );
    }
    throw new ApiError(err?.message || 'Network request failed. Please check your connection.', 0);
  }

  const isLogin = endpoint.includes('/auth/login');

  // Trigger logout event ONLY for expired token on protected endpoints, never on login attempts
  if (response.status === 401 && !isLogin) {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    window.dispatchEvent(new Event('auth_unauthorized'));
  }

  const rawJson = await response.json().catch(() => null);

  if (!response.ok || (rawJson && rawJson.success === false)) {
    const { message, errors, fieldErrors } = parseApiError(
      rawJson,
      response.status,
      response.statusText,
      isLogin
    );
    throw new ApiError(message, response.status, errors, fieldErrors);
  }

  // If response is wrapped in { success, data, message }, unwrap data
  if (rawJson && typeof rawJson === 'object' && 'data' in rawJson && rawJson.data !== undefined) {
    return rawJson.data;
  }

  return (rawJson !== null ? rawJson : {}) as T;
}

export const api = {
  get: <T>(url: string, params?: Record<string, any>) => {
    let query = '';
    if (params) {
      const cleanParams: Record<string, string> = {};
      Object.keys(params).forEach((key) => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          cleanParams[key] = String(params[key]);
        }
      });
      if (Object.keys(cleanParams).length > 0) {
        query = '?' + new URLSearchParams(cleanParams).toString();
      }
    }
    return request<T>(`${url}${query}`, { method: 'GET' });
  },

  post: <T>(url: string, body?: any) =>
    request<T>(url, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(url: string, body?: any) =>
    request<T>(url, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(url: string, body?: any) =>
    request<T>(url, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(url: string) =>
    request<T>(url, {
      method: 'DELETE',
    }),
};
