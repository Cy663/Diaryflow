import { User } from './user';

export interface ApiError {
  error: string;
  code: number;
  details?: unknown;
}

export interface HealthResponse {
  status: 'ok';
  timestamp: string;
}

export interface AuthRegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthLoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface AuthMeResponse {
  user: User;
}
