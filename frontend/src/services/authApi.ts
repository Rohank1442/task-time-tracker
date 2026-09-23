import { api } from './api';
import { AuthResponse, User } from '../types';

export const authApi = {
  signup: async (email: string, password: string): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/auth/signup', { email, password });
    return res.data;
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/auth/login', { email, password });
    return res.data;
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    }
  },

  getMe: async (): Promise<User> => {
    const res = await api.get<User>('/auth/me');
    return res.data;
  },
};
