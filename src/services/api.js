import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://api.example.com',
  timeout: 12000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('payswift_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('payswift_token');
      window.dispatchEvent(new Event('payswift:logout'));
    }
    return Promise.reject(error);
  },
);

export const mockDelay = (value, delay = 650) =>
  new Promise((resolve) => {
    window.setTimeout(() => resolve(value), delay);
  });

export default api;
