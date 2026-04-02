import { User, UserRole } from './user';
import { ScheduleEntry } from './diary';

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
  role: UserRole;
  teacherEmail?: string;
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

export interface DiaryListItem {
  id: string;
  date: string;
  createdAt: string;
}

export interface DiaryListResponse {
  diaries: DiaryListItem[];
}

export interface CurriculumResponse {
  entries: ScheduleEntry[];
}
