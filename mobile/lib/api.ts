import { API_URL } from '../constants/theme';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: Record<string, unknown>;
  error?: { message: string; code?: string };
}

export class ApiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
  }
}

export async function api<T>(endpoint: string, options: RequestInit & { token?: string } = {}): Promise<T> {
  const { token, ...rest } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(rest.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${endpoint}`, { ...rest, headers });
  const json: ApiResponse<T> = await response.json();

  if (!response.ok || !json.success) {
    throw new ApiError(response.status, json.error?.message || 'Request failed');
  }
  return json.data;
}

export async function apiWithMeta<T>(
  endpoint: string,
  options: RequestInit & { token?: string } = {}
): Promise<{ data: T; meta?: Record<string, unknown> }> {
  const { token, ...rest } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(rest.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${endpoint}`, { ...rest, headers });
  const json: ApiResponse<T> = await response.json();

  if (!response.ok || !json.success) {
    throw new ApiError(response.status, json.error?.message || 'Request failed');
  }
  return { data: json.data, meta: json.meta };
}
