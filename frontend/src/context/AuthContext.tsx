import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthResponse } from '../types';
import { authApi } from '../services/authApi';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const currentUser = await authApi.getMe();
          setUser(currentUser);
          localStorage.setItem('user', JSON.stringify(currentUser));
        } catch {
          // Token invalid or expired
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [token]);

  const handleAuthSuccess = (data: AuthResponse) => {
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setToken(data.access_token);
    setUser(data.user);
  };

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    handleAuthSuccess(res);
  };

  const signup = async (email: string, password: string) => {
    const res = await authApi.signup(email, password);
    handleAuthSuccess(res);
  };

  const logout = () => {
    authApi.logout();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
