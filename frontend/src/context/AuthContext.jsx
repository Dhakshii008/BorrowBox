import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { getToken } from '../api/client.js';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const logout = useCallback(async () => {
    localStorage.removeItem('borrowbox_token');
    setUser(null);
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('borrowbox_token', res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const res = await api.post('/auth/register', payload);
    localStorage.setItem('borrowbox_token', res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const refreshUser = useCallback(async () => {
    const token = getToken();
    if (!token) return null;
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.user);
      return res.data.user;
    } catch (error) {
      localStorage.removeItem('borrowbox_token');
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const token = getToken();
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.user);
        } catch (error) {
          localStorage.removeItem('borrowbox_token');
        }
      }
      setLoading(false);
      setInitialized(true);
    };
    init();
  }, []);

  useEffect(() => {
    window.__borrowbox_on_unauthorized = () => {
      localStorage.removeItem('borrowbox_token');
      setUser(null);
    };
  }, []);

  const value = {
    user,
    setUser,
    loading,
    initialized,
    login,
    register,
    logout,
    refreshUser,
    isAuthenticated: Boolean(user),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}