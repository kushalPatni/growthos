import axios from 'axios';

// In production (Vercel): VITE_API_URL = https://growthos-api-wbql.onrender.com
// In local dev: Vite proxy forwards /api → localhost:5000
const BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

const api = axios.create({ baseURL: BASE });

// Attach JWT token to every outgoing request
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('gos_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// Handle expired / missing tokens globally
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('gos_token');
      // Only redirect if not already on auth pages — prevents redirect loops
      const path = window.location.pathname;
      if (path !== '/login' && path !== '/register') {
        window.location.replace('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
