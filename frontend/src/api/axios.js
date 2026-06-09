import axios from 'axios';

const api = axios.create({
  // Hardwiring the exact backend path so it never gets lost
  baseURL: 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept requests to add the Authorization token
api.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (user && user.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
}, (error) => Promise.reject(error));

export default api;