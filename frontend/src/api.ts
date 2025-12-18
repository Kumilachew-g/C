import axios from 'axios';

export const ACCESS_TOKEN_KEY = 'cems_token';
export const REFRESH_TOKEN_KEY = 'cems_refresh';
export const USER_KEY = 'cems_user';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    
    // Handle 401 Unauthorized - try to refresh token
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      
      if (!refreshToken) {
        // No refresh token, redirect to login
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        throw error;
      }
      
      try {
        const { data } = await api.post('/auth/refresh', { refreshToken });
        localStorage.setItem(ACCESS_TOKEN_KEY, data.token);
        localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
        original.headers.Authorization = `Bearer ${data.token}`;
        return api(original);
      } catch (refreshErr) {
        // Refresh failed, clear storage and redirect to login
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        throw refreshErr;
      }
    }
    
    // Handle network errors
    if (!error.response) {
      error.message = 'Network error. Please check your connection and try again.';
    }
    
    // Handle server errors (500+)
    if (error.response?.status >= 500) {
      error.message = 'Server error. Please try again later.';
    }
    
    throw error;
  }
);

export default api;

