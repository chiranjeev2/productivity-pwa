import axios from 'axios';
import { getApiUrl } from '../utils/apiConfig';

const api = axios.create({
  baseURL: getApiUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept requests to add the Authorization token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || JSON.parse(localStorage.getItem('user') || '{}')?.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Intercept 401 responses to cleanly invalidate expired sessions
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      window.dispatchEvent(new Event('auth-unauthorized'));
    }
    return Promise.reject(error);
  }
);

export default api;