import axios from 'axios';

/**
 * Central axios instance.  The JWT is stored in localStorage and attached
 * automatically.  A 401 response from the server clears the token and
 * redirects to /login so the user is never stuck in a broken auth state.
 */
export const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('rg_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('rg_token');
      window.location.replace('/login');
    }
    return Promise.reject(err);
  },
);
