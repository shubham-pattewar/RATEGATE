import { api } from './client.js';

export const authApi = {
  signup: (email, password) => api.post('/auth/signup', { email, password }),
  login: (email, password) => api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
  regenerateApiKey: () => api.post('/auth/api-key/regenerate'),
};

export const endpointsApi = {
  list: () => api.get('/endpoints'),
  get: (id) => api.get(`/endpoints/${id}`),
  create: (data) => api.post('/endpoints', data),
  update: (id, data) => api.patch(`/endpoints/${id}`, data),
  remove: (id) => api.delete(`/endpoints/${id}`),
  stats: (id, range = '24h') => api.get(`/endpoints/${id}/stats`, { params: { range } }),
};
