import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('kathacheck_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('kathacheck_token');
    if (token) {
      api.getMe()
        .then((userData) => {
          setUser(userData);
          localStorage.setItem('kathacheck_user', JSON.stringify(userData));
        })
        .catch(() => {
          localStorage.removeItem('kathacheck_token');
          localStorage.removeItem('kathacheck_user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    localStorage.setItem('kathacheck_token', res.access_token);
    localStorage.setItem('kathacheck_user', JSON.stringify(res.user));
    setUser(res.user);
    return res;
  };

  const register = async (payload) => {
    const res = await api.register(payload);
    localStorage.setItem('kathacheck_token', res.access_token);
    localStorage.setItem('kathacheck_user', JSON.stringify(res.user));
    setUser(res.user);
    return res;
  };

  const logout = () => {
    localStorage.removeItem('kathacheck_token');
    localStorage.removeItem('kathacheck_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, refreshUser: async () => {
      const u = await api.getMe();
      setUser(u);
      localStorage.setItem('kathacheck_user', JSON.stringify(u));
    }}}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
