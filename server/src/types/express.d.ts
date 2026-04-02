import type { UserRole } from '../../../shared/src/types/user';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
        teacherId?: string;
      };
    }
  }
}
