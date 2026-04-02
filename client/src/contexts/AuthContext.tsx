import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { User } from 'shared/types/user';
import type { AuthRegisterRequest, AuthLoginRequest } from 'shared/types/api';
import * as authApi from '../api/auth';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (data: AuthLoginRequest) => Promise<User>;
  register: (data: AuthRegisterRequest) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = authApi.getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    authApi.getMe()
      .then((res) => setUser(res.user))
      .catch(() => authApi.clearToken())
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (data: AuthLoginRequest): Promise<User> => {
    const res = await authApi.login(data);
    setUser(res.user);
    return res.user;
  }, []);

  const register = useCallback(async (data: AuthRegisterRequest): Promise<User> => {
    const res = await authApi.register(data);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(() => {
    authApi.clearToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
