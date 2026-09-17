import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/resources.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = loading, null = logged out
  const [apiKey, setApiKey] = useState(null); // shown once after signup/regenerate

  useEffect(() => {
    const token = localStorage.getItem('rg_token');
    if (!token) { setUser(null); return; }

    authApi.me()
      .then((res) => setUser(res.data.user))
      .catch(() => { localStorage.removeItem('rg_token'); setUser(null); });
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authApi.login(email, password);
    localStorage.setItem('rg_token', res.data.token);
    setUser(res.data.user);
  }, []);

  const signup = useCallback(async (email, password) => {
    const res = await authApi.signup(email, password);
    localStorage.setItem('rg_token', res.data.token);
    setUser(res.data.user);
    setApiKey(res.data.apiKey);
    return res.data.apiKey;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('rg_token');
    setUser(null);
    setApiKey(null);
  }, []);

  const regenerateApiKey = useCallback(async () => {
    const res = await authApi.regenerateApiKey();
    setUser(res.data.user);
    setApiKey(res.data.apiKey);
    return res.data.apiKey;
  }, []);

  const dismissApiKey = useCallback(() => setApiKey(null), []);

  return (
    <AuthContext.Provider value={{ user, apiKey, login, signup, logout, regenerateApiKey, dismissApiKey }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
