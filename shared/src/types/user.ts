export type UserRole = 'student' | 'family' | 'teacher';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  teacherId?: string;
  createdAt: string;
  updatedAt: string;
}
