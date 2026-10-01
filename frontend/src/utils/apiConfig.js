// Centralized API URL normalizer
export const getApiUrl = () => {
  const raw = import.meta.env.VITE_API_URL || 'https://prodpro-backend.onrender.com/api/v1';
  const clean = raw.trim().replace(/\/+$/, '');
  return clean.endsWith('/api/v1') ? clean : `${clean}/api/v1`;
};
