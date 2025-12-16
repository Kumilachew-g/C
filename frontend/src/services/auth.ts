import api, { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY } from '../api';
import type { User } from '../types';

type AuthResponse = { user: User; token: string; refreshToken: string };

export const login = async (email: string, password: string) => {
  const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
  persistAuth(data);
  return data;
};

export const register = async (payload: {
  fullName: string;
  email: string;
  password: string;
  department?: string;
  roleName?: string;
}) => {
  const { data } = await api.post<AuthResponse>('/auth/register', payload);
  persistAuth(data);
  return data;
};

export const logout = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

const persistAuth = ({ user, token, refreshToken }: AuthResponse) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const loadAuth = (): { user: User | null; token: string | null } => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  const rawUser = localStorage.getItem(USER_KEY);
  return { token, user: rawUser ? (JSON.parse(rawUser) as User) : null };
};

