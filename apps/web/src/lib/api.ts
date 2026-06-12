const isLocal = typeof window !== 'undefined'
  ? (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  : (process.env.NODE_ENV === 'development');

const BACKEND_BASE = isLocal
  ? 'http://localhost:5000'
  : 'https://balochi-bazar-backend.vercel.app';

export const getApiUrl = (path: string = '') => {
  return `${BACKEND_BASE}${path}`;
};
