import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true); // true while we verify the stored token

  // On first mount: check if a token exists and is still valid
  useEffect(() => {
    const token = localStorage.getItem('gos_token');
    if (!token) {
      setLoading(false);
      return;
    }
    // Validate token by calling /auth/me
    api.get('/auth/me')
      .then(r => setUser(r.data))
      .catch(() => {
        // Token is expired or invalid — clean it up
        localStorage.removeItem('gos_token');
      })
      .finally(() => setLoading(false));
  }, []);

  // Login: POST email + password → receive JWT + user object
  const login = useCallback(async (email, password) => {
    const r = await api.post('/auth/login', { email, password });
    localStorage.setItem('gos_token', r.data.token);
    setUser(r.data.user);
    return r.data.user;
  }, []);

  // Register: POST name + email + password → receive JWT + user object
  const register = useCallback(async (name, email, password) => {
    const r = await api.post('/auth/register', { name, email, password });
    localStorage.setItem('gos_token', r.data.token);
    setUser(r.data.user);
    return r.data.user;
  }, []);

  // Logout: wipe token and user state
  const logout = useCallback(() => {
    localStorage.removeItem('gos_token');
    setUser(null);
  }, []);

  return (
    <AuthCtx.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
