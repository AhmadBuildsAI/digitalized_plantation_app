import { API_URL } from './constants';

interface ApiOptions extends RequestInit {
  token?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: Record<string, unknown>;
  error?: { message: string; code?: string };
}

export class ApiError extends Error {
  constructor(public statusCode: number, message: string, public code?: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function api<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { token, headers: customHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, { headers, ...rest });
  const json: ApiResponse<T> = await response.json();

  if (!response.ok || !json.success) {
    throw new ApiError(
      response.status,
      json.error?.message || 'An error occurred',
      json.error?.code
    );
  }

  return json.data;
}

export async function apiWithMeta<T>(endpoint: string, options: ApiOptions = {}): Promise<{ data: T; meta?: Record<string, unknown> }> {
  const { token, headers: customHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string>),
  };

  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${endpoint}`, { headers, ...rest });
  const json: ApiResponse<T> = await response.json();

  if (!response.ok || !json.success) {
    throw new ApiError(response.status, json.error?.message || 'An error occurred', json.error?.code);
  }

  return { data: json.data, meta: json.meta };
}
