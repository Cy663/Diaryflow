import { Router } from 'express';
import bcrypt from 'bcryptjs';
import type { AuthRegisterRequest, AuthLoginRequest, ApiError } from '../../../shared/src/types/api';
import { getUserByEmail, createUser, getUser } from '../db';
import { signToken, authenticate } from '../middleware/auth';

export const authRouter = Router();

authRouter.post('/register', async (req, res) => {
  try {
    const { email, password, name, role, teacherEmail } = req.body as AuthRegisterRequest;

    if (!email || !password || !name || !role) {
      const error: ApiError = { error: 'email, password, name, and role are required', code: 400 };
      res.status(400).json(error);
      return;
    }

    if (!['student', 'family', 'teacher'].includes(role)) {
      const error: ApiError = { error: 'role must be student, family, or teacher', code: 400 };
      res.status(400).json(error);
      return;
    }

    if (getUserByEmail(email)) {
      const error: ApiError = { error: 'Email already registered', code: 409 };
      res.status(409).json(error);
      return;
    }

    let teacherId: string | undefined;
    if (role === 'student' || role === 'family') {
      if (!teacherEmail) {
        const error: ApiError = { error: 'teacherEmail is required for student/family accounts', code: 400 };
        res.status(400).json(error);
        return;
      }
      const teacher = getUserByEmail(teacherEmail);
      if (!teacher || teacher.role !== 'teacher') {
        const error: ApiError = { error: 'Teacher not found with that email', code: 404 };
        res.status(404).json(error);
        return;
      }
      teacherId = teacher.id;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userRow = createUser(email, passwordHash, name, role, teacherId);

    const token = signToken({
      id: userRow.id,
      email: userRow.email,
      role: userRow.role,
      teacherId: userRow.teacher_id || undefined,
    });

    res.status(201).json({
      token,
      user: {
        id: userRow.id,
        email: userRow.email,
        name: userRow.name,
        role: userRow.role,
        teacherId: userRow.teacher_id || undefined,
        createdAt: userRow.created_at,
        updatedAt: userRow.updated_at,
      },
    });
  } catch (err) {
    const error: ApiError = {
      error: 'Registration failed',
      code: 500,
      details: err instanceof Error ? err.message : String(err),
    };
    res.status(500).json(error);
  }
});

authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body as AuthLoginRequest;

    if (!email || !password) {
      const error: ApiError = { error: 'email and password are required', code: 400 };
      res.status(400).json(error);
      return;
    }

    const userRow = getUserByEmail(email);
    if (!userRow) {
      const error: ApiError = { error: 'Invalid email or password', code: 401 };
      res.status(401).json(error);
      return;
    }

    const valid = await bcrypt.compare(password, userRow.password_hash);
    if (!valid) {
      const error: ApiError = { error: 'Invalid email or password', code: 401 };
      res.status(401).json(error);
      return;
    }

    const token = signToken({
      id: userRow.id,
      email: userRow.email,
      role: userRow.role,
      teacherId: userRow.teacher_id || undefined,
    });

    res.json({
      token,
      user: {
        id: userRow.id,
        email: userRow.email,
        name: userRow.name,
        role: userRow.role,
        teacherId: userRow.teacher_id || undefined,
        createdAt: userRow.created_at,
        updatedAt: userRow.updated_at,
      },
    });
  } catch (err) {
    const error: ApiError = {
      error: 'Login failed',
      code: 500,
      details: err instanceof Error ? err.message : String(err),
    };
    res.status(500).json(error);
  }
});

authRouter.get('/me', authenticate, (req, res) => {
  const userRow = getUser(req.user!.id);
  if (!userRow) {
    res.status(404).json({ error: 'User not found', code: 404 });
    return;
  }
  res.json({
    user: {
      id: userRow.id,
      email: userRow.email,
      name: userRow.name,
      role: userRow.role,
      teacherId: userRow.teacher_id || undefined,
      createdAt: userRow.created_at,
      updatedAt: userRow.updated_at,
    },
  });
});
