import { ApiErrorPayload } from '../types';

export class ApiError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details: Record<string, string[] | string | unknown>;

  constructor(
    message: string,
    status: number,
    code = 'API_ERROR',
    details: Record<string, string[] | string | unknown> = {}
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Always send HttpOnly cookies
  };

  let response: Response;
  try {
    response = await fetch(url, config);
  } catch (err) {
    throw new ApiError(
      'Unable to connect to the backend server. Please check your network connection.',
      0,
      'NETWORK_ERROR'
    );
  }

  // Handle empty or No-Content responses
  if (response.status === 204) {
    return {} as T;
  }

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');

  let data: unknown;
  try {
    data = isJson ? await response.json() : await response.text();
  } catch {
    data = null;
  }

  if (!response.ok) {
    if (isJson && data && typeof data === 'object' && 'error' in data) {
      const errorPayload = (data as ApiErrorPayload).error;
      throw new ApiError(
        errorPayload.message || 'An error occurred while processing the request.',
        response.status,
        errorPayload.code || 'UNKNOWN_ERROR',
        (errorPayload.details as Record<string, string[] | string | unknown>) || {}
      );
    }

    const fallbackMessage =
      typeof data === 'string' && data.length > 0
        ? data
        : `Request failed with status ${response.status}`;
    throw new ApiError(fallbackMessage, response.status, 'HTTP_ERROR');
  }

  return data as T;
}

export const api = {
  get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return request<T>(endpoint, { ...options, method: 'GET' });
  },

  post<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
    return request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  put<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
    return request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return request<T>(endpoint, { ...options, method: 'DELETE' });
  },
};
