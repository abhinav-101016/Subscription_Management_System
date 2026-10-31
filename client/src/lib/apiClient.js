/**
 * Cadence Production API Client
 * Connects exclusively to live backend services at /api/*
 * Enforces envelope unwrapping, standard token injection, and structured error handling.
 */
const BASE_URL = import.meta.env.VITE_API_URL || '';

export class ApiError extends Error {
  constructor(status, message, details = {}) {
    super(message || 'An unexpected API error occurred');
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = details.fieldErrors || {};
    this.code = details.code || (status === 400 && details.error === 'State Machine Violation' ? 'STATE_MACHINE_VIOLATION' : 'API_ERROR');
    this.details = details;
    this.allowed_transitions = details.allowed_transitions || details.allowedTransitions || [];
    this.current_status = details.current_status;
    this.requested_status = details.requested_status;
  }
}

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('cadence_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (netErr) {
    throw new ApiError(0, 'Unable to connect to server. Please check your network connection.', {
      originalError: netErr.message,
    });
  }

  // Handle 401 Unauthorized globally
  if (response.status === 401) {
    localStorage.removeItem('cadence_token');
    localStorage.removeItem('cadence_user');
    if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/signup')) {
      const currentPath = window.location.pathname + window.location.search;
      window.location.href = `/login?next=${encodeURIComponent(currentPath)}`;
    }
  }

  const contentType = response.headers.get('content-type') || '';
  let data = null;
  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch (_) {
      data = null;
    }
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMsg =
      (data && typeof data === 'object' && (data.message || data.error)) ||
      `Request failed with status ${response.status}`;
    throw new ApiError(response.status, errorMsg, typeof data === 'object' ? data : { raw: data });
  }

  // Envelope unwrapping: if payload has { success, data }, return data directly; else return payload
  if (data && typeof data === 'object' && 'data' in data && data.success !== undefined) {
    return data.data;
  }

  return data;
}

export const api = {
  get: (url, options = {}) => apiRequest(url, { ...options, method: 'GET' }),
  post: (url, body, options = {}) => apiRequest(url, { ...options, method: 'POST', body: JSON.stringify(body) }),
  put: (url, body, options = {}) => apiRequest(url, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  patch: (url, body, options = {}) => apiRequest(url, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
  delete: (url, options = {}) => apiRequest(url, { ...options, method: 'DELETE' }),
};
