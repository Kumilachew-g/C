import { createContext, useContext, useMemo, useState, ReactNode } from 'react';
import { login as apiLogin, register as apiRegister, logout as apiLogout, loadAuth } from '../services/auth';
import type { User } from '../types';

type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<{ user: User; token: string }>;
  register: (payload: { fullName: string; email: string; password: string; department?: string; roleName?: string }) => Promise<{ user: User; token: string }>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { token: initialToken, user: initialUser } = loadAuth();
  const [user, setUser] = useState<User | null>(initialUser);
  const [token, setToken] = useState<string | null>(initialToken);

  const login = async (email: string, password: string) => {
    const { user: u, token: t } = await apiLogin(email, password);
    setUser(u);
    setToken(t);
    return { user: u, token: t };
  };

  const register = async (payload: { fullName: string; email: string; password: string; department?: string; roleName?: string }) => {
    const { user: u, token: t } = await apiRegister(payload);
    setUser(u);
    setToken(t);
    return { user: u, token: t };
  };

  const logout = () => {
    apiLogout();
    setUser(null);
    setToken(null);
  };

  const value = useMemo(
    () => ({
      user,
      token,
      login,
      register,
      logout,
    }),
    [user, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};

