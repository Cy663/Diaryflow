import type { AuthRegisterRequest, AuthLoginRequest, AuthResponse, AuthMeResponse } from 'shared/types/api';

const TOKEN_KEY = 'diaryflow_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(url, { ...options, headers });
}

export async function register(data: AuthRegisterRequest): Promise<AuthResponse> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Registration failed: ${res.status}`);
  }
  const result: AuthResponse = await res.json();
  setToken(result.token);
  return result;
}

export async function login(data: AuthLoginRequest): Promise<AuthResponse> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Login failed: ${res.status}`);
  }
  const result: AuthResponse = await res.json();
  setToken(result.token);
  return result;
}

export async function getMe(): Promise<AuthMeResponse> {
  const res = await authFetch('/api/auth/me');
  if (!res.ok) {
    throw new Error('Not authenticated');
  }
  return res.json();
}
