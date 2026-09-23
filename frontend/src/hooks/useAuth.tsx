import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserPreferences } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  preferences: UserPreferences | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, whatsappNumber?: string) => Promise<void>;
  logout: () => void;
  updatePreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('news_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('news_auth_token');
  });
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (token) {
      authApi
        .getMe()
        .then((data) => {
          setUser(data.user);
          setPreferences(data.preferences);
          localStorage.setItem('news_user', JSON.stringify(data.user));
        })
        .catch(() => {
          logout();
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    const data = await authApi.login({ email, password });
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('news_auth_token', data.token);
    localStorage.setItem('news_user', JSON.stringify(data.user));
  };

  const register = async (name: string, email: string, password: string, whatsappNumber?: string) => {
    const data = await authApi.register({ name, email, password, whatsappNumber });
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('news_auth_token', data.token);
    localStorage.setItem('news_user', JSON.stringify(data.user));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setPreferences(null);
    localStorage.removeItem('news_auth_token');
    localStorage.removeItem('news_user');
  };

  const updatePreferences = async (newPrefs: Partial<UserPreferences>) => {
    const updated = await authApi.updatePreferences(newPrefs);
    setPreferences(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        preferences,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        register,
        logout,
        updatePreferences,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
